const Customer = require("../models/Customer");
const Order = require("../models/Order");
const httpError = require("../utils/httpError");
const escapeRegex = require("../utils/escapeRegex");
const { readPaging, toMeta, readSort } = require("../utils/queryFilters");

const USER_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  "spend-desc": { totalSpent: -1 },
  "orders-desc": { orderCount: -1 },
};

// Shared by the users panel and the filtered CSV export.
function buildUserMatch(query = {}) {
  const { search, status } = query;
  const match = {};
  if (status === "active" || status === "inactive") match.status = status;
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  return match;
}

// Aggregation up to the sort, so both the paged list and the unpaged export
// rank customers the same way.
function buildUserStages(query = {}) {
  const { orders } = query;
  const sort = readSort(query, Object.keys(USER_SORTS), "newest");
  const ordersMatch =
    orders === "with" ? { orderCount: { $gt: 0 } } : orders === "without" ? { orderCount: { $lte: 0 } } : null;

  return [
    { $match: buildUserMatch(query) },
    { $lookup: { from: "orders", localField: "_id", foreignField: "customer", as: "orders" } },
    {
      $addFields: {
        orderCount: { $size: "$orders" },
        totalSpent: { $sum: "$orders.total" },
      },
    },
    { $project: { orders: 0 } },
    ...(ordersMatch ? [{ $match: ordersMatch }] : []),
    { $sort: USER_SORTS[sort] },
  ];
}

async function listUserRows(query = {}) {
  return Customer.aggregate(buildUserStages(query));
}

// GET /api/admin/users
// Customers with how many orders they placed and what they have spent.
// ?search=&status=&orders=with|without&sort=&page=&limit=
async function listUsers(req, res) {
  const { page, limit, skip } = readPaging(req.query, { defaultLimit: 20 });
  const sort = readSort(req.query, Object.keys(USER_SORTS), "newest");

  const [result] = await Customer.aggregate([
    ...buildUserStages(req.query),
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        summary: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              spent: { $sum: "$totalSpent" },
              orders: { $sum: "$orderCount" },
              withOrders: { $sum: { $cond: [{ $gt: ["$orderCount", 0] }, 1, 0] } },
            },
          },
        ],
      },
    },
  ]);

  const summary = result?.summary?.[0] || { total: 0, spent: 0, orders: 0, withOrders: 0 };
  const [activeCount, inactiveCount] = await Promise.all([
    Customer.countDocuments({ status: "active" }),
    Customer.countDocuments({ status: "inactive" }),
  ]);

  res.json({
    success: true,
    data: result?.data || [],
    meta: {
      ...toMeta({ page, limit, total: summary.total }),
      sort,
      active: activeCount,
      inactive: inactiveCount,
      spent: Math.round(Number(summary.spent || 0) * 100) / 100,
      orders: summary.orders,
      withOrders: summary.withOrders,
    },
  });
}

// GET /api/admin/users/:id  (customer + their orders)
async function getUserDetail(req, res) {
  const user = await Customer.findById(req.params.id).lean();
  if (!user) throw httpError(404, "Customer not found");

  const orders = await Order.find({ customer: user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: { user, orders } });
}

// PATCH /api/admin/users/:id  (activate / deactivate, edit basic details)
async function updateUser(req, res) {
  const { name, phone, status } = req.body;
  const update = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) throw httpError(400, "Name cannot be empty");
    update.name = name.trim();
  }
  if (phone !== undefined) update.phone = typeof phone === "string" ? phone.trim() : "";
  if (status !== undefined) {
    if (!["active", "inactive"].includes(status)) throw httpError(400, "Invalid customer status");
    update.status = status;
  }
  if (Object.keys(update).length === 0) throw httpError(400, "Nothing to update");

  const user = await Customer.findByIdAndUpdate(req.params.id, update, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!user) throw httpError(404, "Customer not found");

  res.json({ success: true, data: user });
}

module.exports = { listUsers, getUserDetail, updateUser, listUserRows, buildUserMatch, USER_SORTS };
