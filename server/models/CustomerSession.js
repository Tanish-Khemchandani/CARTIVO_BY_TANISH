const mongoose = require("mongoose");

const customerSessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = mongoose.model("CustomerSession", customerSessionSchema);
