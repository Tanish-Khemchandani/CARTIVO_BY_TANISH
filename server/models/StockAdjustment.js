const mongoose = require("mongoose");

// one row per manual stock change, so the inventory history always adds up:
// a product's stock is the sum of its adjustments plus its starting stock
const stockAdjustmentSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    delta: { type: Number, required: true },
    reason: { type: String, default: "", trim: true },
    resultingStock: { type: Number, required: true, min: 0 },
    adjustedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

stockAdjustmentSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model("StockAdjustment", stockAdjustmentSchema);
