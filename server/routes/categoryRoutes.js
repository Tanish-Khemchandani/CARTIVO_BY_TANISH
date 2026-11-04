const express = require("express");
const { requireAdmin, requireWritableAdmin } = require("../middleware/requireAdmin");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.get("/", listCategories);
router.post("/", requireAdmin, requireWritableAdmin, createCategory);
router.patch("/:id", requireAdmin, requireWritableAdmin, updateCategory);
router.delete("/:id", requireAdmin, requireWritableAdmin, deleteCategory);

module.exports = router;
