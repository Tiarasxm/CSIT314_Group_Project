// scripts/makeToken.js
import "dotenv/config";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "csr_secret_2024"; // fallback if missing

// Customize these fields for your test user
const payload = {
  userId: "pin-001",
  role: "pin",
};

const token = jwt.sign(payload, secret, { expiresIn: "7d" });

console.log("✅ JWT token generated:\n");
console.log(token);
console.log("\n📌 Paste this into your browser console:");
console.log(`
localStorage.setItem("pin_userId", "${payload.userId}");
localStorage.setItem("pin_token", "${token}");
`);
