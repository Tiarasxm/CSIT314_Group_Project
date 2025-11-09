// server.js
import "dotenv/config"; // loads .env (ESM-safe)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import syncPinCounter from "./config/syncPinCounter.js"; // ✅ aligns pin counter with DB

// Models used by dashboard route
import User from "./models/User.js";
import Request from "./models/Request.js";

// Middleware
import { attachAuth, requireAuth } from "./middleware/requireAuth.js";

// Auth controller (for /api/auth/me & /api/auth/logout)
import * as PinAuth from "./controllers/pinAuthController.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import savedRoutes from "./routes/savedRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import pinRoutes from "./routes/pinRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";


const app = express();

/* ---------------------- MIDDLEWARE ---------------------- */
const allowedOrigins = [
  process.env.CORS_ORIGIN, // e.g. http://localhost:5173
  "http://localhost:5173",
  "https://localhost:5173",
  "http://127.0.0.1:5173",
  "https://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// 🔹 Make JWT (if present) available as req.user everywhere (non-blocking)
app.use(attachAuth);

/* ---------------------- HEALTH/ROOT ---------------------- */
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "csr-backend" });
});
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/* ---------------------- AUTH UTIL (no new files needed) ---------------------- */
// After login, frontend can call this to get { userId, name }
app.get("/api/auth/me", requireAuth, PinAuth.me);
// Logout clears the auth cookie
app.post("/api/auth/logout", requireAuth, PinAuth.logout);

/* ---------------------- API ROUTES ---------------------- */
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/pin", pinRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/users", adminUserRoutes);  

/* ---------------------- PIN DASHBOARD ----------------------
   GET /api/pin/dashboard
   - Auth required
   - Accepts optional ?userId=pin-001  (otherwise uses JWT userId)
   - SIMPLE STATUSES:
       pending  => status: "pending"
       upcoming => status: "upcoming"
       past     => status: "past"
   - No populate (avoids StrictPopulateError).
---------------------------------------------------------------- */
app.get("/api/pin/dashboard", async (req, res) => {
  try {
    // accept both ?userId= and ?user=, else try JWT (attachAuth must be on)
    const pinUserId =
      (req.query.userId || req.query.user || "").trim() ||
      (req.user?.userId || "");

    if (!pinUserId) {
      return res.status(400).json({ message: "Missing userId (pass ?userId=pin-### or login)" });
    }

    const pinDoc = await User.findOne({ userId: pinUserId, role: "pin" })
      .select("userId name firstName lastName email role")
      .lean();
    if (!pinDoc) return res.status(404).json({ message: "User not found" });

    // Define filters ONCE so counts & lists are identical
    const PENDING_FILTER  = { user: pinUserId, status: { $in: ["pending"] } };
    const UPCOMING_FILTER = { user: pinUserId, status: { $in: ["upcoming"] } };
    const PAST_FILTER     = { user: pinUserId, status: { $in: ["completed"] } };

    const [pendingCount, upcomingCount, pastCount, pending, upcoming, past] = await Promise.all([
      Request.countDocuments(PENDING_FILTER),
      Request.countDocuments(UPCOMING_FILTER),
      Request.countDocuments(PAST_FILTER),

      Request.find(PENDING_FILTER)
        .sort({ createdAt: -1 }).limit(5)
        .select("title details location preferredAt scheduledAt status createdAt")
        .lean(),

      Request.find(UPCOMING_FILTER)
        .sort({ createdAt: -1 }).limit(5)
        .select("title details location preferredAt scheduledAt status createdAt")
        .lean(),

      Request.find(PAST_FILTER)
        .sort({ createdAt: -1 }).limit(5)
        .select("title details location preferredAt scheduledAt status createdAt")
        .lean(),
    ]);

    res.json({
      user: {
        userId: pinDoc.userId,
        name:
          pinDoc.name ||
          `${pinDoc.firstName ?? ""} ${pinDoc.lastName ?? ""}`.trim() ||
          "Friend",
        firstName: pinDoc.firstName ?? "",
        lastName: pinDoc.lastName ?? "",
        email: pinDoc.email ?? "",
      },
      stats: { pending: pendingCount, upcoming: upcomingCount, past: pastCount },
      pending,
      upcoming,
      past,
    });
  } catch (e) {
    console.error("Dashboard route error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
});


/* ---------------------- 404 & ERROR HANDLERS ---------------------- */
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  if (String(err.message || "").startsWith("CORS blocked for origin:")) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: err?.message || "Server Error" });
});

/* ---------------------- BOOT ---------------------- */
const PORT = process.env.PORT || 5001;

(async () => {
  try {
    await connectDB();
    await syncPinCounter(); // ✅ make counter >= current max pin-###
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error("Boot error:", e.message);
    process.exit(1);
  }
})();
