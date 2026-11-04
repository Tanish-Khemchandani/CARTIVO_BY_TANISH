const mongoose = require("mongoose");

/*
 * Product review. Only signed-in customers review; one review per product
 * per customer. Moderation statuses: PENDING -> APPROVED | HIDDEN | REJECTED.
 * Product.rating / product.numReviews are recomputed from APPROVED reviews
 * every time a moderation status changes.
 */
const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    // snapshot of the customer name at review time (customer may be deleted)
    authorName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["PENDING", "APPROVED", "HIDDEN", "REJECTED"], default: "PENDING" },
    moderationNote: { type: String, default: "" },
    moderatedAt: { type: Date, default: null },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, customer: 1 }, { unique: true });
reviewSchema.index({ status: 1, createdAt: -1 });

// recompute the product's rating from its APPROVED reviews
reviewSchema.statics.syncProductRating = async function (productId) {
  const Product = mongoose.model("Product");
  const [stats] = await this.aggregate([
    { $match: { product: productId, status: "APPROVED" } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats ? Math.round(stats.average * 10) / 10 : 0,
    numReviews: stats ? stats.count : 0,
  });
};

module.exports = mongoose.model("Review", reviewSchema);
