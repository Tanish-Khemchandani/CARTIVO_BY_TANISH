const express = require("express");
const { getSummary, listAllProducts, listAllCategories } = require("../controllers/adminController");
const { listInventory, adjustStock, stockHistory } = require("../controllers/inventoryController");
const { listUsers, getUserDetail, updateUser } = require("../controllers/adminUsersController");
const { exportCsv } = require("../controllers/exportController");
const { listAdmins, createAdmin, updateAdmin } = require("../controllers/adminAdminsController");
const { listGstRules, createGstRule, updateGstRule, deleteGstRule } = require("../controllers/gstRuleController");
const { listReviews, updateReviewStatus, deleteReview } = require("../controllers/reviewController");
const { getAdminSettings, updateAdminSettings } = require("../controllers/settingController");
const { requireAdmin, requireWritableAdmin } = require("../middleware/requireAdmin");
const { requireSuperAdmin } = require("../middleware/requireSuperAdmin");

const router = express.Router();

// every route below this line requires an admin session
router.use(requireAdmin);

router.get("/summary", getSummary);
router.get("/products", listAllProducts);
router.get("/categories", listAllCategories);

// inventory
router.get("/inventory", listInventory);
router.post("/inventory/:productId/adjust", requireWritableAdmin, adjustStock);
router.get("/inventory/:productId/history", stockHistory);

// customers
router.get("/users", listUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id", requireWritableAdmin, updateUser);

// CSV exports
router.get("/export/:resource", exportCsv);

// GST rules
router.get("/gst", listGstRules);
router.post("/gst", requireWritableAdmin, createGstRule);
router.patch("/gst/:id", requireWritableAdmin, updateGstRule);
router.delete("/gst/:id", requireWritableAdmin, deleteGstRule);

// review moderation
router.get("/reviews", listReviews);
router.patch("/reviews/:id", requireWritableAdmin, updateReviewStatus);
router.delete("/reviews/:id", requireWritableAdmin, deleteReview);

// website settings
router.get("/settings", getAdminSettings);
router.patch("/settings", requireWritableAdmin, updateAdminSettings);

// admin-user management: super admin only
router.get("/admins", requireSuperAdmin, listAdmins);
router.post("/admins", requireSuperAdmin, createAdmin);
router.patch("/admins/:id", requireSuperAdmin, updateAdmin);

module.exports = router;
