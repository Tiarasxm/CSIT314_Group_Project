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
import requireAuth from "./middleware/requireAuth.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import savedRoutes from "./routes/savedRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import pinRoutes from "./routes/pinRoutes.js";

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
      // allow same-origins and tools (Postman/no origin)
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

/* ---------------------- HEALTH/ROOT ---------------------- */
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "csr-backend" });
});
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/* ---------------------- API ROUTES ---------------------- */
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/pin", pinRoutes);

/* ---------------------- PIN DASHBOARD ----------------------
   GET /api/pin/dashboard?userId=pin-001
   - Auth required
---------------------------------------------------------------- */
app.get("/api/pin/dashboard", requireAuth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    // 1) Find the PIN user document by readable userId
    const pin = await User.findOne({ userId, role: "pin" })
      .select("_id name firstName lastName userId email")
      .lean();

    if (!pin) return res.status(404).json({ message: "User not found" });

    const now = new Date();

    // 2) Query requests by the user's ObjectId
    const [upcoming, pending, past] = await Promise.all([
      // Upcoming: accepted/confirmed in the future
      Request.find({
        user: pin._id,
        status: { $in: ["accepted", "confirmed"] },
        scheduledAt: { $gte: now },
      })
        .populate("volunteerId", "name email")
        .populate("category", "name")
        .sort({ scheduledAt: 1 })
        .limit(5)
        .lean(),

      // Pending: awaiting volunteer
      Request.find({
        user: pin._id,
        status: { $in: ["pending", "open"] },
      })
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Past: completed OR happened already
      Request.find({
        user: pin._id,
        $or: [
          { status: "completed" },
          { status: { $in: ["accepted", "confirmed"] }, scheduledAt: { $lt: now } },
        ],
      })
        .populate("volunteerId", "name email")
        .populate("category", "name")
        .sort({ scheduledAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // 3) Respond
    res.json({
      user: {
        name: pin.name || `${pin.firstName ?? ""} ${pin.lastName ?? ""}`.trim(),
        firstName: pin.firstName ?? "",
        lastName: pin.lastName ?? "",
        userId: pin.userId,
        email: pin.email,
      },
      stats: {
        pending: pending.length,
        upcoming: upcoming.length,
        past: past.length,
      },
      upcoming,
      pending,
      past,
    });
  } catch (e) {
    console.error("Dashboard route error:", e);
    res.status(500).json({ message: e.message });
  }
});

/* ---------------------- 404 & ERROR HANDLERS ---------------------- */
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  // If CORS origin check threw an Error object, surface it cleanly
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
