const Product = require("../models/Product");
const StockAdjustment = require("../models/StockAdjustment");
const httpError = require("../utils/httpError");
const escapeRegex = require("../utils/escapeRegex");
const { readPaging, toMeta, readSort } = require("../utils/queryFilters");

function toInventoryRow(product) {
  const stock = Number(product.stock || 0);
  const threshold = Number(product.lowStockThreshold || 0);
  return {
    _id: product._id,
    name: product.name,
    sku: product.sku || "",
    brand: product.brand || "",
    stock,
    lowStockThreshold: threshold,
    status: product.status,
    category: product.category,
    outOfStock: stock <= 0,
    lowStock: stock > 0 && stock <= threshold,
  };
}

const INVENTORY_SORTS = {
  // the default: whatever needs restocking first, then alphabetical
  stock: { stock: 1, name: 1 },
  "stock-desc": { stock: -1, name: 1 },
  name: { name: 1 },
  threshold: { lowStockThreshold: 1, stock: 1 },
};

// Shared by the inventory panel and the filtered CSV export.
function buildInventoryFilter(query = {}) {
  const { search, category, stockState, lowOnly } = query;
  const filter = {};
  if (category) filter.category = category;
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ name: rx }, { sku: rx }, { brand: rx }];
  }

  // stockState is the newer filter; lowOnly is kept so older links still work
  const state = stockState || (lowOnly === "true" || lowOnly === "1" ? "low" : "");
  if (state === "out") filter.stock = { $lte: 0 };
  if (state === "low") {
    filter.stock = { $gt: 0 };
    filter.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
  }
  if (state === "ok") filter.$expr = { $gt: ["$stock", "$lowStockThreshold"] };

  return filter;
}

// GET /api/admin/inventory
// ?search=&category=&stockState=low|out|ok&sort=&page=&limit=
// The counts in meta always describe the whole catalog, so the health panel
// does not change when a filter is applied.
async function listInventory(req, res) {
  const { page, limit, skip } = readPaging(req.query, { defaultLimit: 20 });
  const sort = readSort(req.query, Object.keys(INVENTORY_SORTS), "stock");
  const filter = buildInventoryFilter(req.query);

  const [products, total, catalogTotal, outOfStock, lowStock, trackedUnits] = await Promise.all([
    Product.find(filter).populate("category", "name slug").sort(INVENTORY_SORTS[sort]).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
    Product.countDocuments({}),
    Product.countDocuments({ stock: { $lte: 0 } }),
    Product.countDocuments({ stock: { $gt: 0 }, $expr: { $lte: ["$stock", "$lowStockThreshold"] } }),
    Product.aggregate([{ $group: { _id: null, units: { $sum: "$stock" } } }]),
  ]);

  res.json({
    success: true,
    data: products.map(toInventoryRow),
    meta: {
      ...toMeta({ page, limit, total }),
      sort,
      catalogTotal,
      units: trackedUnits[0]?.units || 0,
      outOfStock,
      lowStock,
      healthy: Math.max(0, catalogTotal - outOfStock - lowStock),
    },
  });
}

// POST /api/admin/inventory/:productId/adjust
// Atomic, and refuses to push stock below zero.
async function adjustStock(req, res) {
  const delta = Number(req.body?.delta);
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (!Number.isInteger(delta) || delta === 0) {
    throw httpError(400, "Enter a non-zero whole number of units");
  }

  const filter = { _id: req.params.productId };
  if (delta < 0) filter.stock = { $gte: -delta };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { stock: delta } },
    { returnDocument: "after", runValidators: true }
  ).populate("category", "name slug");

  if (!product) {
    const exists = await Product.exists({ _id: req.params.productId });
    if (!exists) throw httpError(404, "Product not found");
    throw httpError(400, "That adjustment would take stock below zero");
  }

  await StockAdjustment.create({
    product: product._id,
    delta,
    reason,
    resultingStock: product.stock,
    adjustedBy: req.admin?.email || "",
  });

  res.json({ success: true, data: toInventoryRow(product) });
}

// GET /api/admin/inventory/:productId/history
async function stockHistory(req, res) {
  const product = await Product.findById(req.params.productId).select("name sku stock lowStockThreshold");
  if (!product) throw httpError(404, "Product not found");

  const adjustments = await StockAdjustment.find({ product: product._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ success: true, data: { product, adjustments } });
}

module.exports = { listInventory, adjustStock, stockHistory, buildInventoryFilter, INVENTORY_SORTS };
