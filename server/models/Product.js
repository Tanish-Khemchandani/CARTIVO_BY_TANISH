const mongoose = require("mongoose");
const slugify = require("../utils/slugify");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    sku: { type: String, unique: true, sparse: true },
    brand: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: 0, min: 0 },
    // what the customer actually pays; kept in sync below so
    // filtering/sorting by price stays a single simple field
    finalPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    images: [{ type: String }],
    options: {
      type: Map,
      of: [{ type: String, trim: true }],
      default: {},
    },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "draft"], default: "active" },
    // filled in from real reviews once the review feature exists
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, status: 1 });
productSchema.index({ finalPrice: 1 });
productSchema.index({ name: "text", description: "text" });

productSchema.pre("validate", function () {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  const onSale = this.salePrice > 0 && this.salePrice < this.price;
  this.finalPrice = onSale ? this.salePrice : this.price;
});

module.exports = mongoose.model("Product", productSchema);
