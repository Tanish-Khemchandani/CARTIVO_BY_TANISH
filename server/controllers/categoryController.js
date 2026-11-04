const Category = require("../models/Category");
const slugify = require("../utils/slugify");
const httpError = require("../utils/httpError");

// GET /api/categories
// returns every active category, flat; the client groups parent/child itself
async function listCategories(req, res) {
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, data: categories });
}

// POST /api/categories  (admin)
async function createCategory(req, res) {
  const { name, parent, sortOrder } = req.body;
  if (!name) throw httpError(400, "Category name is required");

  const category = await Category.create({
    name,
    slug: slugify(name),
    parent: parent || null,
    sortOrder: sortOrder || 0,
  });

  res.status(201).json({ success: true, data: category });
}

// PATCH /api/categories/:id  (admin)
async function updateCategory(req, res) {
  const { name, parent, sortOrder, active } = req.body;
  const update = {};
  if (name !== undefined) {
    update.name = name;
    update.slug = slugify(name);
  }
  if (parent !== undefined) update.parent = parent || null;
  if (sortOrder !== undefined) update.sortOrder = sortOrder;
  if (active !== undefined) update.active = active;

  const category = await Category.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!category) throw httpError(404, "Category not found");

  res.json({ success: true, data: category });
}

// DELETE /api/categories/:id  (admin) - soft delete, keeps history intact
async function deleteCategory(req, res) {
  const category = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!category) throw httpError(404, "Category not found");
  res.json({ success: true, data: category });
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
