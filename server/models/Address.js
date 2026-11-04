const mongoose = require("mongoose");

// A saved delivery address in a customer's address book. The same fields
// as Order.shippingAddress, so an address can be copied onto an order
// (or an order's address saved back) without any reshaping.
const addressSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    // exactly one default per customer; the controller keeps that true
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model("Address", addressSchema);
