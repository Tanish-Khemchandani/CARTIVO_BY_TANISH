const Review = require("../models/Review");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const httpError = require("../utils/httpError");
const escapeRegex = require("../utils/escapeRegex");
const { readPaging, toMeta } = require("../utils/queryFilters");

const STATUSES = ["PENDING", "APPROVED", "HIDDEN", "REJECTED"];

function cleanComment(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

// GET /api/products/:id/reviews
// Only approved reviews are public. The product check deliberately prevents
// reviews for drafts/deleted products from being exposed by a guessed id.
async function listProductReviews(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(400, "Invalid product id");

  const product = await Product.exists({ _id: id, status: "active" });
  if (!product) throw httpError(404, "Product not found");

  const { page, limit, skip } = readPaging(req.query, { defaultLimit: 10 });
  const filter = { product: id, status: "APPROVED" };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .select("authorName rating comment createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({ success: true, data: reviews, meta: toMeta({ page, limit, total }) });
}

// POST /api/products/:id/reviews  (signed-in customer)
// Reviews always enter moderation as PENDING, and the compound unique index
// enforces one review per customer/product even under concurrent requests.
async function createProductReview(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(400, "Invalid product id");

  const product = await Product.exists({ _id: id, status: "active" });
  if (!product) throw httpError(404, "Product not found");

  const rating = Number(req.body?.rating);
  const comment = cleanComment(req.body?.comment);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw httpError(400, "Choose a rating from 1 to 5");
  }
  if (comment.length < 3 || comment.length > 2000) {
    throw httpError(400, "Review text must be between 3 and 2000 characters");
  }

  const review = await Review.create({
    product: id,
    customer: req.customer.customerId,
    authorName: req.customer.name,
    rating,
    comment,
    status: "PENDING",
  });

  res.status(201).json({
    success: true,
    data: review,
    message: "Thanks — your review has been submitted for moderation.",
  });
}

// GET /api/admin/reviews
// ?status=PENDING&rating=1-5&search=&page=&limit=
// The status counts and the star distribution always cover every review, so
// the moderation tabs stay meaningful while a filter is active.
async function listReviews(req, res) {
  const { status, rating, search } = req.query;
  const { page, limit, skip } = readPaging(req.query, { defaultLimit: 20 });

  const filter = {};
  if (status && STATUSES.includes(status)) filter.status = status;
  const ratingValue = Number.parseInt(rating, 10);
  if (ratingValue >= 1 && ratingValue <= 5) filter.rating = ratingValue;
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ comment: rx }, { authorName: rx }];
  }

  const [reviews, total, statusCounts, ratingCounts] = await Promise.all([
    Review.find(filter)
      .populate("product", "name slug images")
      .populate("customer", "name email status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
    Review.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Review.aggregate([{ $group: { _id: "$rating", count: { $sum: 1 } } }]),
  ]);

  const counts = { PENDING: 0, APPROVED: 0, HIDDEN: 0, REJECTED: 0 };
  for (const row of statusCounts) counts[row._id] = row.count;

  const distribution = [1, 2, 3, 4, 5].map((stars) => ({
    rating: stars,
    count: ratingCounts.find((row) => row._id === stars)?.count || 0,
  }));
  const rated = distribution.reduce((sum, row) => sum + row.count, 0);
  const average = rated
    ? Math.round((distribution.reduce((sum, row) => sum + row.rating * row.count, 0) / rated) * 100) / 100
    : 0;

  res.json({
    success: true,
    data: reviews,
    meta: {
      ...toMeta({ page, limit, total }),
      ...counts,
      distribution,
      rated,
      average,
      totalReviews: Object.values(counts).reduce((sum, value) => sum + value, 0),
    },
  });
}

// PATCH /api/admin/reviews/:id  { status, moderationNote? }
async function updateReviewStatus(req, res) {
  const { status, moderationNote } = req.body;
  if (!STATUSES.includes(status)) throw httpError(400, `Status must be one of ${STATUSES.join(", ")}`);

  const review = await Review.findById(req.params.id);
  if (!review) throw httpError(404, "Review not found");

  const statusChanged = review.status !== status;
  review.status = status;
  review.moderationNote = typeof moderationNote === "string" ? moderationNote.trim() : review.moderationNote;
  review.moderatedAt = new Date();
  review.moderatedBy = req.admin?.adminId || review.moderatedBy;
  await review.save();

  // the product lives on the rating; resync it whenever the status changes
  await Review.syncProductRating(review.product);

  res.json({ success: true, data: review, statusChanged });
}

// DELETE /api/admin/reviews/:id
async function deleteReview(req, res) {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw httpError(404, "Review not found");

  if (review.status === "APPROVED") await Review.syncProductRating(review.product);
  res.json({ success: true, data: { _id: review._id } });
}

module.exports = {
  listProductReviews,
  createProductReview,
  listReviews,
  updateReviewStatus,
  deleteReview,
};
