const express = require("express");
const { requireCustomer } = require("../middleware/requireCustomer");
const {
  listAddresses,
  createAddress,
  updateAddress,
  removeAddress,
} = require("../controllers/addressController");

const router = express.Router();

// requireCustomer is applied per route (not with router.use) so mounting
// this router can never intercept another /api/customer/* path.
router.get("/", requireCustomer, listAddresses);
router.post("/", requireCustomer, createAddress);
router.patch("/:id", requireCustomer, updateAddress);
router.delete("/:id", requireCustomer, removeAddress);

module.exports = router;
