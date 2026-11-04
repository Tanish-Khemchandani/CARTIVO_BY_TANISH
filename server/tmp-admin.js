// TEMPORARY: creates a throwaway super admin so the admin panels can be
// verified in the browser. Delete after testing (see tmp-admin-remove.js).
require("dotenv").config();
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {
  // keep the system resolver
}

const mongoose = require("mongoose");
const Admin = require("./models/Admin");

const EMAIL = "codebuff.admin@example.com";
const PASSWORD = "tempadmin12345";

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Admin.find({}).select("email role isActive");
  console.log("existing admins:", existing.map((a) => `${a.email} (${a.role})`));

  const { salt, hash } = await Admin.setPassword(PASSWORD);
  const admin = await Admin.findOneAndUpdate(
    { email: EMAIL },
    { $set: { name: "Temp Admin", passwordHash: hash, passwordSalt: salt, role: "SUPER_ADMIN", isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  console.log("test admin ready:", admin.email, admin.role);
  console.log("password:", PASSWORD);

  await mongoose.disconnect();
})().catch((error) => {
  console.error("failed:", error.message);
  process.exit(1);
});
