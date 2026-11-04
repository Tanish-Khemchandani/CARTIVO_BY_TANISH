// Mints a short-lived admin session directly in MongoDB for local testing.
// Prints only the raw token; pass it to test scripts as CARTIVO_TEST_NODE.
// Run:  node scripts/_mintAdminSession.js <email>
require("dotenv").config();
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {}

const { createHash, randomBytes } = require("crypto");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const AdminSession = require("../models/AdminSession");

(async () => {
  const email = (process.argv[2] || "").trim().toLowerCase();
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await Admin.findOne({ email }).lean();
  if (!admin || !admin.isActive) {
    console.error(`No active admin found for ${email || "<email missing>"}`);
    process.exit(1);
  }

  const token = randomBytes(32).toString("hex");
  await AdminSession.create({
    tokenHash: createHash("sha256").update(token).digest("hex"),
    adminId: admin._id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  console.log(token);
  await mongoose.disconnect();
})().catch((error) => {
  console.error("Mint failed:", error.message);
  process.exit(1);
});
