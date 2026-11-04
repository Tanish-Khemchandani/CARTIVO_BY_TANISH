const Product = require("../models/Product");
const Order = require("../models/Order");
const httpError = require("../utils/httpError");
const { readSort } = require("../utils/queryFilters");
const { buildProductFilter, PRODUCT_SORTS } = require("./adminController");
const { buildInventoryFilter, INVENTORY_SORTS } = require("./inventoryController");
const { listUserRows, USER_SORTS } = require("./adminUsersController");
const { buildOrderFilter, ORDER_SORTS } = require("./orderController");

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows, columns) {
  const header = columns.map((c) => csvCell(c.label)).join(",");
  const body = rows.map((row) => columns.map((c) => csvCell(c.get(row))).join(",")).join("\n");
  return `${header}\n${body}${body ? "\n" : ""}`;
}

function iso(value) {
  return value ? new Date(value).toISOString() : "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Each export reuses the filter builder of the matching admin list, so a
// report can never disagree with the screen it was exported from.
function sortFor(query, sorts, fallback) {
  return sorts[readSort(query, Object.keys(sorts), fallback)];
}

const builders = {
  products: {
    baseFilename: "cartivo-products",
    columns: [
      { label: "Name", get: (p) => p.name },
      { label: "Slug", get: (p) => p.slug },
      { label: "SKU", get: (p) => p.sku },
      { label: "Brand", get: (p) => p.brand },
      { label: "Category", get: (p) => p.category?.name },
      { label: "Price", get: (p) => p.price },
      { label: "Sale price", get: (p) => p.salePrice },
      { label: "Final price", get: (p) => p.finalPrice },
      { label: "Stock", get: (p) => p.stock },
      { label: "Status", get: (p) => p.status },
      { label: "Featured", get: (p) => (p.featured ? "yes" : "no") },
      { label: "Created", get: (p) => iso(p.createdAt) },
    ],
    fetch: (query) =>
      Product.find(buildProductFilter(query))
        .populate("category", "name")
        .sort(sortFor(query, PRODUCT_SORTS, "newest"))
        .lean(),
  },
  orders: {
    baseFilename: "cartivo-orders",
    columns: [
      { label: "Order no", get: (o) => o.orderNo },
      { label: "Customer", get: (o) => o.customer?.name },
      { label: "Email", get: (o) => o.customer?.email },
      { label: "Items", get: (o) => (o.items || []).reduce((n, i) => n + i.quantity, 0) },
      { label: "Subtotal", get: (o) => o.subtotal },
      { label: "GST included", get: (o) => o.gstAmount },
      { label: "Shipping", get: (o) => o.shipping },
      { label: "Total", get: (o) => o.total },
      { label: "Status", get: (o) => o.status },
      { label: "Payment", get: (o) => o.paymentStatus },
      { label: "Placed", get: (o) => iso(o.createdAt) },
    ],
    fetch: async (query) => {
      const filter = await buildOrderFilter(query);
      return Order.find(filter)
        .populate("customer", "name email")
        .sort(sortFor(query, ORDER_SORTS, "newest"))
        .lean();
    },
  },
  users: {
    baseFilename: "cartivo-users",
    columns: [
      { label: "Name", get: (u) => u.name },
      { label: "Email", get: (u) => u.email },
      { label: "Phone", get: (u) => u.phone },
      { label: "Status", get: (u) => u.status },
      { label: "Orders", get: (u) => u.orderCount },
      { label: "Total spent", get: (u) => u.totalSpent },
      { label: "Joined", get: (u) => iso(u.createdAt) },
    ],
    fetch: (query) => listUserRows(query),
  },
  inventory: {
    baseFilename: "cartivo-inventory",
    columns: [
      { label: "Name", get: (p) => p.name },
      { label: "SKU", get: (p) => p.sku },
      { label: "Brand", get: (p) => p.brand },
      { label: "Category", get: (p) => p.category?.name },
      { label: "Stock", get: (p) => p.stock },
      { label: "Low stock threshold", get: (p) => p.lowStockThreshold },
      { label: "Status", get: (p) => p.status },
    ],
    fetch: (query) =>
      Product.find(buildInventoryFilter(query))
        .populate("category", "name")
        .sort(sortFor(query, INVENTORY_SORTS, "stock"))
        .lean(),
  },
};

// How many matching rows the preview table shows. The count still covers
// every match, and the CSV download always contains all of them.
const PREVIEW_ROWS = 12;

// GET /api/admin/export/:resource?search=&status=&category=&stockState=&from=&to=&sort=
// With preview=1 the route returns the matching row count plus the first rows
// instead of the file, so the reports screen can show and sanity-check the
// data before downloading it.
async function exportCsv(req, res) {
  const builder = builders[req.params.resource];
  if (!builder) throw httpError(404, "Unknown export");

  const rows = await builder.fetch(req.query);

  if (req.query.preview === "1" || req.query.preview === "true") {
    res.json({
      success: true,
      data: {
        resource: req.params.resource,
        rows: rows.length,
        sample: rows.slice(0, PREVIEW_ROWS),
        previewLimit: PREVIEW_ROWS,
      },
    });
    return;
  }

  const csv = toCsv(rows, builder.columns);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${builder.baseFilename}-${today()}.csv"`);
  res.send(csv);
}

module.exports = { exportCsv, builders };
