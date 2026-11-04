const mongoose = require("mongoose");

/*
 * One GST rate applies to either a whole category or a single product.
 * Pricing uses the newest active rule whose effectiveFrom has passed, so the
 * manager can stage rate changes ahead of time instead of editing at midnight.
 */
const gstRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // percentage, e.g. 18 for 18%
    rate: { type: Number, required: true, min: 0, max: 100 },
    scope: { type: String, enum: ["category", "product"], required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    active: { type: Boolean, default: true },
    // when null the rule is effective immediately
    effectiveFrom: { type: Date, default: null },
  },
  { timestamps: true }
);

gstRuleSchema.index({ scope: 1, category: 1, active: 1 });
gstRuleSchema.index({ scope: 1, product: 1, active: 1 });

gstRuleSchema.pre("validate", function () {
  if (this.scope === "category" && !this.category) this.invalidate("category", "A category must be selected");
  if (this.scope === "product" && !this.product) this.invalidate("product", "A product must be selected");
});

module.exports = mongoose.model("GstRule", gstRuleSchema);
