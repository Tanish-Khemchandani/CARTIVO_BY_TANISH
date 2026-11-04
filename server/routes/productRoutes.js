const express = require("express");
const { requireAdmin, requireWritableAdmin } = require("../middleware/requireAdmin");
const {
  listProducts,
  getProductBySlug,
  listFeatured,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { listProductReviews, createProductReview } = require("../controllers/reviewController");
const { requireCustomer } = require("../middleware/requireCustomer");

const router = express.Router();

// specific paths before the :slug catch-all, or "featured" would be read as a slug
router.get("/featured", listFeatured);
router.get("/", listProducts);
router.post("/", requireAdmin, requireWritableAdmin, createProduct);
router.get("/:id/reviews", listProductReviews);
router.post("/:id/reviews", requireCustomer, createProductReview);
router.get("/:slug", getProductBySlug);
router.patch("/:id", requireAdmin, requireWritableAdmin, updateProduct);
router.delete("/:id", requireAdmin, requireWritableAdmin, deleteProduct);

module.exports = router;
