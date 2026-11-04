const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const ContactInquiry = require("../models/ContactInquiry");
const Review = require("../models/Review");
const Customer = require("../models/Customer");
const escapeRegex = require("../utils/escapeRegex");
const { readPaging, toMeta, readSort, windowStart } = require("../utils/queryFilters");

// Orders in these states are not revenue: they never completed checkout or
// they were cancelled/failed. Everything else counts toward sales figures.
const NON_REVENUE_STATUSES = ["IN_CHECKOUT", "CANCELLED", "FAILED"];
const REVENUE_FILTER = { status: { $nin: NON_REVENUE_STATUSES } };

// the ranges the dashboard offers; the trend buckets by day up to a month and
// by week beyond that, so a 90-day chart stays readable
const RANGES = [7, 30, 90];
const DEFAULT_RANGE = 7;

const ORDER_STATUS_ORDER = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "IN_CHECKOUT",
];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// local-time YYYY-MM-DD, so an order placed at 00:30 IST still lands on
// the day the admin sees in the table
function dateKey(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function readDays(value) {
  const days = Number.parseInt(value, 10);
  return RANGES.includes(days) ? days : DEFAULT_RANGE;
}

// Builds the empty buckets for the window plus the key function that maps a
// date onto the bucket it belongs to.
function buildBuckets(days) {
  const unit = days <= 31 ? "day" : "week";
  const step = unit === "day" ? 1 : 7;
  const start = windowStart(days);
  const buckets = [];

  for (let offset = 0; offset < days; offset += step) {
    const from = startOfDay(new Date(start.getTime() + offset * 24 * 60 * 60 * 1000));
    const to = startOfDay(new Date(from.getTime() + step * 24 * 60 * 60 * 1000));
    buckets.push({
      key: dateKey(from),
      from,
      to,
      // a weekday reads best over a week, a date over longer windows
      label: unit === "day"
        ? days <= 7
          ? from.toLocaleDateString("en-IN", { weekday: "short" })
          : String(from.getDate())
        : from.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      fullLabel: from.toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" }),
      revenue: 0,
      orders: 0,
      customers: 0,
    });
  }

  const keyFor = (date) => {
    const value = new Date(date).getTime();
    for (let i = buckets.length - 1; i >= 0; i -= 1) {
      if (value >= buckets[i].from.getTime()) return buckets[i].key;
    }
    return null;
  };

  return { buckets, keyFor, unit };
}

// GET /api/admin/summary?days=7|30|90
// Everything the dashboard shows, in one round trip. Every number is
// computed from the database - no placeholder or sample values.
async function getSummary(req, res) {
  const now = new Date();
  const days = readDays(req.query.days);
  const rangeStart = windowStart(days);
  const monthStart = startOfMonth(now);
  const { buckets, keyFor, unit } = buildBuckets(days);

  const [
    totalProducts,
    totalCategories,
    totalCustomers,
    totalOrders,
    newInquiries,
    pendingReviews,
    lowStock,
    outOfStock,
    lowStockProducts,
    recentOrders,
    allTimeSales,
    monthSales,
    windowOrders,
    windowCustomers,
    topProductRows,
    categoryRows,
    statusRows,
    spenderRows,
  ] = await Promise.all([
    Product.countDocuments({ status: "active" }),
    Category.countDocuments({ active: true }),
    Customer.countDocuments({}),
    Order.countDocuments({}),
    ContactInquiry.countDocuments({ status: "NEW" }),
    Review.countDocuments({ status: "PENDING" }),
    Product.countDocuments({ status: "active", $expr: { $lte: ["$stock", "$lowStockThreshold"] } }),
    Product.countDocuments({ status: "active", stock: { $lte: 0 } }),
    Product.find({ status: "active", $expr: { $lte: ["$stock", "$lowStockThreshold"] } })
      .select("name sku stock lowStockThreshold")
      .sort({ stock: 1, name: 1 })
      .limit(5)
      .lean(),
    Order.find({})
      .select("orderNo total status paymentStatus createdAt customer")
      .populate("customer", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Order.aggregate([
      { $match: REVENUE_FILTER },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 }, units: { $sum: { $size: "$items" } } } },
    ]),
    Order.aggregate([
      { $match: { ...REVENUE_FILTER, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
    // the trend is bucketed in JS, so only the fields it needs come back
    Order.find({ ...REVENUE_FILTER, createdAt: { $gte: rangeStart } })
      .select("total createdAt")
      .lean(),
    Customer.find({ createdAt: { $gte: rangeStart } }).select("createdAt").lean(),
    Order.aggregate([
      { $match: { ...REVENUE_FILTER, createdAt: { $gte: rangeStart } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          units: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    // revenue per category, resolved through the product for each line item
    Order.aggregate([
      { $match: { ...REVENUE_FILTER, createdAt: { $gte: rangeStart } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "categories", localField: "product.category", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$category.name", revenue: { $sum: "$revenue" } } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { ...REVENUE_FILTER, createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: "$customer",
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    ]),
  ]);

  for (const order of windowOrders) {
    const bucket = buckets.find((item) => item.key === keyFor(order.createdAt));
    if (!bucket) continue;
    bucket.revenue += Number(order.total || 0);
    bucket.orders += 1;
  }
  for (const customer of windowCustomers) {
    const bucket = buckets.find((item) => item.key === keyFor(customer.createdAt));
    if (bucket) bucket.customers += 1;
  }

  const series = buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    fullLabel: bucket.fullLabel,
    revenue: round2(bucket.revenue),
    orders: bucket.orders,
    customers: bucket.customers,
  }));

  const windowRevenue = series.reduce((sum, point) => sum + point.revenue, 0);
  const windowOrderCount = series.reduce((sum, point) => sum + point.orders, 0);
  const windowCustomersCount = series.reduce((sum, point) => sum + point.customers, 0);

  const categoryTotal = categoryRows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
  const categorySplit = categoryRows.slice(0, 5).map((row) => ({
    name: row._id || "Uncategorised",
    revenue: round2(row.revenue),
  }));
  const restCategories = categoryRows.slice(5);
  if (restCategories.length > 0) {
    categorySplit.push({
      name: "Other",
      revenue: round2(restCategories.reduce((sum, row) => sum + Number(row.revenue || 0), 0)),
    });
  }

  const statusCounts = new Map(statusRows.map((row) => [row._id, row]));
  const statusSplit = ORDER_STATUS_ORDER.filter((status) => statusCounts.has(status)).map((status) => {
    const row = statusCounts.get(status);
    return { status, count: row.count, revenue: round2(row.revenue) };
  });

  const allTime = allTimeSales[0] || { revenue: 0, orders: 0 };
  const month = monthSales[0] || { revenue: 0, orders: 0 };

  res.json({
    success: true,
    data: {
      range: { days, unit, from: rangeStart, to: now },
      totalProducts,
      totalCategories,
      totalOrders,
      totalCustomers,
      newInquiries,
      pendingReviews,
      lowStock,
      outOfStock,
      sales: {
        total: round2(allTime.revenue),
        orders: allTime.orders,
        thisMonth: round2(month.revenue),
        ordersThisMonth: month.orders,
        averageOrderValue: allTime.orders ? round2(allTime.revenue / allTime.orders) : 0,
      },
      window: {
        revenue: round2(windowRevenue),
        orders: windowOrderCount,
        customers: windowCustomersCount,
        averageOrderValue: windowOrderCount ? round2(windowRevenue / windowOrderCount) : 0,
      },
      series,
      topProducts: topProductRows.map((row) => ({
        name: row._id || "Unknown product",
        revenue: round2(row.revenue),
        units: row.units,
      })),
      categorySplit,
      categoryTotal: round2(categoryTotal),
      statusSplit,
      topSpenders: spenderRows.map((row) => ({
        id: row._id,
        name: row.customer?.name || "Guest",
        email: row.customer?.email || "",
        revenue: round2(row.revenue),
        orders: row.orders,
      })),
      recentOrders,
      lowStockProducts,
    },
  });
}

const PRODUCT_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  "price-desc": { finalPrice: -1 },
  "price-asc": { finalPrice: 1 },
  stock: { stock: 1, name: 1 },
};

// Shared by the products panel and the filtered CSV export, so a report can
// never disagree with what the screen shows.
function buildProductFilter(query = {}) {
  const { search, status, category, stock } = query;
  const filter = {};
  if (status === "active" || status === "draft") filter.status = status;
  if (category) filter.category = category;
  if (stock === "out") filter.stock = { $lte: 0 };
  if (stock === "low") {
    filter.stock = { $gt: 0 };
    filter.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
  }
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ name: rx }, { sku: rx }, { brand: rx }];
  }
  return filter;
}

// GET /api/admin/products
// Unlike the public catalog this includes draft products, so items that were
// soft-deleted (status: "draft") stay visible and can be published again.
async function listAllProducts(req, res) {
  const { page, limit, skip } = readPaging(req.query, { defaultLimit: 20 });
  const sort = readSort(req.query, Object.keys(PRODUCT_SORTS), "newest");
  const filter = buildProductFilter(req.query);

  const [products, total, activeCount, draftCount, lowStockCount, outOfStockCount] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(PRODUCT_SORTS[sort])
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
    Product.countDocuments({ status: "active" }),
    Product.countDocuments({ status: "draft" }),
    Product.countDocuments({ status: "active", $expr: { $lte: ["$stock", "$lowStockThreshold"] } }),
    Product.countDocuments({ status: "active", stock: { $lte: 0 } }),
  ]);

  res.json({
    success: true,
    data: products,
    meta: {
      ...toMeta({ page, limit, total }),
      sort,
      active: activeCount,
      draft: draftCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    },
  });
}

// GET /api/admin/categories  (admin)
// Includes inactive categories so they can be re-activated from the panel.
async function listAllCategories(req, res) {
  const categories = await Category.find({}).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, data: categories });
}

module.exports = { getSummary, listAllProducts, listAllCategories, buildProductFilter, PRODUCT_SORTS };
