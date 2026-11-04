const Product = require("../models/Product");
const mongoose = require("mongoose");
const httpError = require("../utils/httpError");
const escapeRegex = require("../utils/escapeRegex");
const { validateImageList, deleteUnreferencedProductPhotos } = require("./imageUploadController");

// only these fields can ever be written from a request body; slug, finalPrice
// and rating are derived so a client cannot set them directly
const WRITABLE_FIELDS = [
  "name",
  "sku",
  "brand",
  "description",
  "price",
  "salePrice",
  "stock",
  "lowStockThreshold",
  "category",
  "images",
  "options",
  "featured",
  "status",
];

function pickProductFields(body = {}) {
  const data = {};
  for (const key of WRITABLE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

// GET /api/products
// supports category trees, search, price/stock filters, sorting, and pagination
async function listProducts(req, res) {
  const {
    category,
    categories,
    search,
    brand,
    minPrice,
    maxPrice,
    inStock,
    sort,
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { status: "active" };
  const categoryIds = categories
    ? String(categories).split(",").map((id) => id.trim()).filter(Boolean)
    : category
      ? [String(category)]
      : [];
  if (categoryIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw httpError(400, "One or more category filters are invalid");
  }
  if (categoryIds.length) filter.category = { $in: categoryIds };
  if (search) {
    const searchRegex = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [
      { name: searchRegex },
      { brand: searchRegex },
      { description: searchRegex },
    ];
  }
  if (brand) filter.brand = { $regex: "^" + escapeRegex(brand) + "$", $options: "i" };
  if (minPrice || maxPrice) {
    filter.finalPrice = {};
    if (minPrice !== undefined && minPrice !== "") {
      const value = Number(minPrice);
      if (!Number.isFinite(value) || value < 0) throw httpError(400, "Minimum price is invalid");
      filter.finalPrice.$gte = value;
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      const value = Number(maxPrice);
      if (!Number.isFinite(value) || value < 0) throw httpError(400, "Maximum price is invalid");
      filter.finalPrice.$lte = value;
    }
  }
  if (inStock === "true" || inStock === "1") filter.stock = { $gt: 0 };

  const brandFacetFilter = { ...filter };
  delete brandFacetFilter.brand;
  const sortMap = {
    price_asc: { finalPrice: 1 },
    price_desc: { finalPrice: -1 },
    newest: { createdAt: -1 },
    featured: { featured: -1, createdAt: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const [items, total, brands] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sortBy)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
    Product.distinct("brand", brandFacetFilter),
  ]);

  res.json({
    success: true,
    data: items,
    meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    facets: { brands: brands.filter(Boolean).sort((a, b) => a.localeCompare(b)) },
  });
}

// GET /api/products/:slug
// Also accepts a raw product id, because the guest wishlist stores ids and
// needs to resolve them to full product records.
async function getProductBySlug(req, res) {
  const { slug } = req.params;
  const filter = mongoose.isValidObjectId(slug)
    ? { _id: slug, status: "active" }
    : { slug, status: "active" };
  const product = await Product.findOne(filter).populate("category", "name slug");
  if (!product) throw httpError(404, "Product not found");
  res.json({ success: true, data: product });
}

// GET /api/products/featured
async function listFeatured(req, res) {
  const items = await Product.find({ status: "active", featured: true })
    .populate("category", "name slug")
    .limit(8);
  res.json({ success: true, data: items });
}

// POST /api/products  (admin)
async function createProduct(req, res) {
  const data = pickProductFields(req.body);
  validateImageList(data.images); // at least 3 distinct uploaded photos
  const product = await Product.create(data);
  res.status(201).json({ success: true, data: product });
}

// PATCH /api/products/:id  (admin)
// Uses save() rather than findByIdAndUpdate so the model's pre("validate")
// hook runs and finalPrice is recomputed from price/salePrice on every edit.
async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, "Product not found");
  const data = pickProductFields(req.body);
  if (data.images !== undefined) validateImageList(data.images);
  const removedImages = data.images === undefined
    ? []
    : product.images.filter((image) => !data.images.includes(image));
  Object.assign(product, data);
  await product.save();
  await deleteUnreferencedProductPhotos(removedImages);
  res.json({ success: true, data: product });
}

// DELETE /api/products/:id  (admin) - soft delete, keeps order history intact
async function deleteProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, { status: "draft" }, { new: true });
  if (!product) throw httpError(404, "Product not found");
  res.json({ success: true, data: product });
}

module.exports = {
  listProducts,
  getProductBySlug,
  listFeatured,
  createProduct,
  updateProduct,
  deleteProduct,
};
