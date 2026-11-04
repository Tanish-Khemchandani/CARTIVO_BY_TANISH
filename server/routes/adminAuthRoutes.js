const express = require("express");
const adminAuthController = require("../controllers/adminAuthController");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

router.post("/login", adminAuthController.login);
router.get("/me", requireAdmin, adminAuthController.me);
router.post("/logout", adminAuthController.logout);

module.exports = router;
