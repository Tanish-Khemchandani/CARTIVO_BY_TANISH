const mongoose = require("mongoose");

const adminSessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = mongoose.model("AdminSession", adminSessionSchema);
