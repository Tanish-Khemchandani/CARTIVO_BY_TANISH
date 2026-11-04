const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");
const { submitInquiry, listInquiries, updateInquiryStatus } = require("../controllers/contactController");

const router = express.Router();

router.post("/", submitInquiry);
router.get("/", requireAdmin, listInquiries);
router.patch("/:id", requireAdmin, updateInquiryStatus);

module.exports = router;
