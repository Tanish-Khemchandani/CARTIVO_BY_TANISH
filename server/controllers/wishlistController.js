const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const httpError = require("../utils/httpError");

const MAX_ITEMS = 100;

function isValidObjectId(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

async function getOrCreateWishlist(customerId) {
  return Wishlist.findOneAndUpdate(
    { customer: customerId },
    { $setOnInsert: { customer: customerId, items: [] } },
    { new: true, upsert: true }
  );
}

// GET /api/wishlist - current customer's wishlist with live product data
async function getWishlist(req, res) {
  const wishlist = await Wishlist.findOne({ customer: req.customer.customerId })
    .populate({
      path: "items.product",
      // anything a ProductCard renders must be here; draft products are
      // filtered out below rather than in the query, so removal stays obvious
      select:
        "name slug price salePrice finalPrice stock images brand status category rating numReviews",
      populate: { path: "category", select: "name slug" },
    });

  const items = (wishlist?.items || []).filter((item) => item.product && item.product.status === "active");

  res.json({ success: true, data: { items, count: items.length } });
}

// POST /api/wishlist/:productId
async function addToWishlist(req, res) {
  const productId = req.params.productId;
  if (!isValidObjectId(productId)) throw httpError(400, "Invalid product id");

  // only visible storefront products can be wishlisted
  const product = await Product.findOne({ _id: productId, status: "active" }).select("_id");
  if (!product) throw httpError(404, "Product not found");

  const wishlist = await getOrCreateWishlist(req.customer.customerId);

  if (wishlist.items.some((item) => String(item.product) === productId)) {
    return res.json({ success: true, data: { items: wishlist.items, count: wishlist.items.length }, message: "Already in wishlist" });
  }

  // $push with capped size keeps the list bounded under any race
  const updated = await Wishlist.findOneAndUpdate(
    { customer: req.customer.customerId },
    { $push: { items: { $each: [{ product: productId }], $position: 0, $slice: -MAX_ITEMS } } },
    { new: true }
  );

  res.status(201).json({ success: true, data: { items: updated.items, count: updated.items.length } });
}

// DELETE /api/wishlist/:productId
async function removeFromWishlist(req, res) {
  const productId = req.params.productId;
  if (!isValidObjectId(productId)) throw httpError(400, "Invalid product id");

  const updated = await Wishlist.findOneAndUpdate(
    { customer: req.customer.customerId },
    { $pull: { items: { product: productId } } },
    { new: true }
  );

  res.json({ success: true, data: { items: updated?.items || [], count: updated?.items.length || 0 } });
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
