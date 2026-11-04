/**
 * Creates or updates an admin account directly in MongoDB.
 *
 * Usage (from server/):
 *   node scripts/createAdmin.js                          # uses ADMIN_EMAIL + ADMIN_PASSWORD from .env
 *   node scripts/createAdmin.js --email a@b.com --password secret --name "Tanish" --role SUPER_ADMIN
 *
 * The password is only ever hashed (scrypt) before being stored; it is
 * never written anywhere in plaintext.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

// Same Windows/ISP DNS-SRV workaround server.js applies before connecting.
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {
  // keep the system resolver
}

const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email" || arg === "--password" || arg === "--name" || arg === "--role") {
      const value = argv[i + 1];
      if (!value) {
        console.error(`Missing value for ${arg}`);
        process.exit(1);
      }
      args[arg.slice(2)] = value;
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = String(args.email || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(args.password || process.env.ADMIN_PASSWORD || "");
  const name = args.name || email.split("@")[0].replace(/[._]/g, " ");
  const role = args.role || "SUPER_ADMIN";

  if (!email || !password) {
    console.error(
      "Provide credentials via the environment (ADMIN_EMAIL, ADMIN_PASSWORD in .env) or flags:\n" +
        "  node scripts/createAdmin.js --email you@example.com --password 'secret' --role SUPER_ADMIN"
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`Role must be one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Add it to server/.env first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const { salt, hash } = await Admin.setPassword(password);
    const existing = await Admin.findOne({ email });
    if (existing) {
      existing.name = name;
      existing.passwordHash = hash;
      existing.passwordSalt = salt;
      existing.role = role;
      existing.isActive = true;
      await existing.save();
      console.log(`Updated existing admin: ${email} (role: ${role})`);
    } else {
      await Admin.create({ email, name, passwordHash: hash, passwordSalt: salt, role });
      console.log(`Created admin: ${email} (role: ${role})`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exit(1);
});
