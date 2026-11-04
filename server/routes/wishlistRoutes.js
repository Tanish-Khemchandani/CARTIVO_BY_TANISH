const express = require("express");
const { requireCustomer } = require("../middleware/requireCustomer");
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlistController");

const router = express.Router();

router.use(requireCustomer);

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;
