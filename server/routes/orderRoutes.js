const express = require("express");
const { requireAdmin, requireWritableAdmin } = require("../middleware/requireAdmin");
const { requireCustomer } = require("../middleware/requireCustomer");
const { listOrders, listMyOrders, getOrder, updateOrderStatus, trackOrder } = require("../controllers/orderController");
const { quote, createOrder } = require("../controllers/checkoutController");

const router = express.Router();

// public checkout endpoints (guest COD orders); everything else on /orders requires admin
router.post("/quote", quote);
router.post("/track", trackOrder);
router.post("/", createOrder);

// the signed-in customer's own order history; declared before the admin
// routes (and their requireAdmin gate) on purpose
router.get("/mine", requireCustomer, listMyOrders);

router.use(requireAdmin);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.patch("/:id/status", requireWritableAdmin, updateOrderStatus);

module.exports = router;
