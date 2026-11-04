// Creates or resets a bootstrap admin from environment variables.
// Run:  node scripts/createSuperAdmin.js
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from server/.env (see .env.example),
// plus optional ADMIN_NAME and ADMIN_ROLE (default SUPER_ADMIN).
// Passwords are hashed with crypto.scrypt, same as the login flow expects.
//
// Safe to re-run: an existing admin with the same email gets a new password
// and is re-activated instead of failing on the unique index.
require("dotenv").config();
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {}

const mongoose = require("mongoose");
const Admin = require("../models/Admin");

(async () => {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!email || !password || password.length < 8) {
    console.error("Set ADMIN_EMAIL and a ADMIN_PASSWORD of at least 8 characters in server/.env first.");
    process.exit(1);
  }

  const existing = Object.keys(process.env).filter((key) => /password/i.test(key) && process.env[key] === password);
  if (existing.length > 1) {
    console.error("ADMIN_PASSWORD matches another env value; refusing to proceed.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const { hash, salt } = await Admin.setPassword(password);
  const admin = await Admin.findOneAndUpdate(
    { email },
    {
      name: (process.env.ADMIN_NAME || "Store Admin").trim(),
      email,
      passwordHash: hash,
      passwordSalt: salt,
      role: ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(process.env.ADMIN_ROLE) ? process.env.ADMIN_ROLE : "SUPER_ADMIN",
      isActive: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).select("name email role isActive");

  console.log(`Admin ready: ${admin.email} (${admin.role}, ${admin.isActive ? "active" : "inactive"})`);
  console.log("Sign in at /admin/login with these credentials.");
  await mongoose.disconnect();
})().catch((error) => {
  console.error("Bootstrap failed:", error.message);
  process.exit(1);
});
