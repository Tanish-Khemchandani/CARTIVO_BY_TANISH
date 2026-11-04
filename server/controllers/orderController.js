const Order = require("../models/Order");
// register the Customer model so populate("customer") below has a schema to use
const Customer = require("../models/Customer");
const httpError = require("../utils/httpError");
const escapeRegex = require("../utils/escapeRegex");
const { readPaging, toMeta, parseDateRange, readSort } = require("../utils/queryFilters");

// statuses that never count as sales, derived from the model so a new status
// cannot silently start counting as revenue
const NON_REVENUE_STATUSES = ["IN_CHECKOUT", "CANCELLED", "FAILED"];
const REVENUE_FILTER = { status: { $nin: NON_REVENUE_STATUSES } };

// what a customer sees about their own orders - everything except the
// internal customer reference and admin-only fields
const MY_ORDER_FIELDS =
  "orderNo status paymentStatus paymentMethod items subtotal gstAmount shipping total shippingAddress createdAt updatedAt";

// Phone numbers are stored as typed (+91 98765 43210 / 9876543210), so
// compare them by digits and ignore a country code prefix.
function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function samePhone(a, b) {
  const left = phoneDigits(a);
  const right = phoneDigits(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.length >= 10 && right.length >= 10 && left.slice(-10) === right.slice(-10);
}

// POST /api/orders/track  (public)
// Order number plus the phone used at checkout. Returns only the parts of the
// order a shopper needs to follow it - never the address or contact details.
async function trackOrder(req, res) {
  const orderNo = String(req.body?.orderNo || "").trim().toUpperCase();
  const phone = String(req.body?.phone || "").trim();
  const digits = phoneDigits(phone);

  if (!orderNo || !digits) {
    throw httpError(400, "Enter your order number and the phone number used at checkout");
  }
  if (orderNo.length > 40 || digits.length > 15) {
    throw httpError(400, "Enter a valid order number and phone number");
  }

  const order = await Order.findOne({ orderNo, status: { $ne: "IN_CHECKOUT" } }).select(
    "orderNo status paymentStatus paymentMethod items subtotal shipping total createdAt updatedAt shippingAddress.phone"
  );

  // Same message whether the order is missing or the phone does not match,
  // so the endpoint cannot be used to discover valid order numbers.
  if (!order || !samePhone(order.shippingAddress?.phone, phone)) {
    throw httpError(404, "We could not find an order with that number and phone number.");
  }

  res.json({
    success: true,
    data: {
      orderNo: order.orderNo,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      placedAt: order.createdAt,
      updatedAt: order.updatedAt,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      items: (order.items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    },
  });
}

// GET /api/orders/mine  (signed-in customer)
// Order history for the signed-in account only; IN_CHECKOUT rows are
// abandoned checkouts, never orders the customer placed.
async function listMyOrders(req, res) {
  const orders = await Order.find({
    customer: req.customer.customerId,
    status: { $ne: "IN_CHECKOUT" },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .select(MY_ORDER_FIELDS);

  res.json({ success: true, data: orders });
}

const ORDER_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "value-desc": { total: -1 },
  "value-asc": { total: 1 },
};

// Shared by the orders panel and the filtered CSV export. Orders only hold a
// snapshot of the address, so a name/email search has to resolve matching
// customers first.
async function buildOrderFilter(query = {}) {
  const { status, search } = query;
  const range = parseDateRange(query.from, query.to);

  const filter = {};
  if (status && status !== "ALL") filter.status = status;
  if (range) filter.createdAt = range;

  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    const matchingCustomers = await Customer.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
      .select("_id")
      .lean();

    filter.$or = [
      { orderNo: rx },
      { "shippingAddress.fullName": rx },
      { "shippingAddress.phone": rx },
      { "shippingAddress.city": rx },
      { customer: { $in: matchingCustomers.map((customer) => customer._id) } },
    ];
  }

  return filter;
}

// GET /api/orders  (admin)
// ?status=&search=&from=&to=&sort=&page=&limit=
// The status counts and the revenue summary describe the whole filtered set,
// not just the page that came back.
async function listOrders(req, res) {
  const { page, limit, skip } = readPaging(req.query, { defaultLimit: 20 });
  const sort = readSort(req.query, Object.keys(ORDER_SORTS), "newest");
  const filter = await buildOrderFilter(req.query);

  const statusFilter = { ...filter };
  delete statusFilter.status;

  const [orders, total, statusRows, revenueRows] = await Promise.all([
    Order.find(filter).populate("customer", "name email").sort(ORDER_SORTS[sort]).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate([
      { $match: statusFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { ...filter, ...REVENUE_FILTER } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
  ]);

  const revenue = revenueRows[0] || { revenue: 0, orders: 0 };
  const statusCounts = {};
  for (const row of statusRows) statusCounts[row._id] = row.count;

  res.json({
    success: true,
    data: orders,
    meta: {
      ...toMeta({ page, limit, total }),
      sort,
      statusCounts,
      statuses: Order.ORDER_STATUSES,
      revenue: Math.round(Number(revenue.revenue || 0) * 100) / 100,
      revenueOrders: revenue.orders,
      averageOrderValue: revenue.orders
        ? Math.round((Number(revenue.revenue || 0) / revenue.orders) * 100) / 100
        : 0,
    },
  });
}

// GET /api/orders/:id
async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate("customer", "name email");
  if (!order) throw httpError(404, "Order not found");
  res.json({ success: true, data: order });
}

// PATCH /api/orders/:id/status  (admin)
async function updateOrderStatus(req, res) {
  if (req.admin?.isDemo) throw httpError(403, "Demo manager access is read-only");
  const { status } = req.body;
  if (!Order.ORDER_STATUSES.includes(status)) throw httpError(400, "Invalid status");

  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) throw httpError(404, "Order not found");
  res.json({ success: true, data: order });
}

module.exports = { listOrders, listMyOrders, getOrder, updateOrderStatus, trackOrder, buildOrderFilter, ORDER_SORTS };
