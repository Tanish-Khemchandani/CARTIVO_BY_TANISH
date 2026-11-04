const mongoose = require("mongoose");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const { priceCart } = require("../services/pricingService");
const { loadGstRates } = require("../services/gstService");
const httpError = require("../utils/httpError");
const { sanitizeAddress } = require("../utils/addressValidation");
const { getCustomerFromRequest } = require("../middleware/requireCustomer");

// Batch of products for the given items, limited to sellable products.
function loadProducts(items) {
  const ids = items.map((i) => new mongoose.Types.ObjectId(i.productId));
  return Product.find({ _id: { $in: ids }, status: "active" });
}

function sanitizeItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw httpError(400, "Cart is empty");
  }
  if (rawItems.length > 50) throw httpError(400, "Too many distinct items");

  return rawItems.map((item, index) => {
    const productId = String(item?.productId || "");
    const quantity = Number(item?.quantity);
    if (!mongoose.isValidObjectId(productId)) {
      throw httpError(400, `Invalid product id in item ${index + 1}`);
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw httpError(400, `Quantity for item ${index + 1} must be between 1 and 99`);
    }
    const selectedOptions = item?.selectedOptions && typeof item.selectedOptions === "object" && !Array.isArray(item.selectedOptions)
      ? Object.fromEntries(Object.entries(item.selectedOptions).slice(0, 8).map(([key, value]) => [String(key).slice(0, 40), String(value).slice(0, 80)]))
      : {};
    return { productId, quantity, selectedOptions };
  });
}

// GET /api/orders/quote  body: { items: [{ productId, quantity }] }
// Returns server-calculated totals using DB prices. Prices in the request are ignored.
async function quote(req, res) {
  const items = sanitizeItems(req.body?.items);
  const products = await loadProducts(items);
  const gstRates = await loadGstRates(products);
  const result = priceCart(products, items, gstRates);
  res.json({
    success: true,
    data: {
      items: result.pricedItems,
      subtotal: result.subtotal,
      gstAmount: result.gstAmount,
      gstBreakdown: result.gstBreakdown,
      shipping: result.shipping,
      total: result.total,
      freeShippingAbove: 499,
      shippingFlatFee: 49,
    },
  });
}

// Build a readable, unique order number like CV-2AB3CD-9F.
// Retries on the (very unlikely) duplicate-key race.
async function nextOrderNo() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no easy-to-confuse chars
  for (let attempt = 0; attempt < 5; attempt++) {
    let suffix = "";
    for (let i = 0; i < 7; i++) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const orderNo = `CV-${suffix.slice(0, 3)}-${suffix.slice(3)}`;
    const exists = await Order.exists({ orderNo });
    if (!exists) return orderNo;
  }
  throw httpError(500, "Could not allocate an order number");
}

// POST /api/orders  body: { items, shippingAddress, paymentMethod: "COD" }
// Creates the order and decrements stock with a race-guarded update so two
// shoppers buying the last unit cannot both succeed.
async function createOrder(req, res) {
  const items = sanitizeItems(req.body?.items);
  const address = sanitizeAddress(req.body?.shippingAddress);
  const paymentMethod = String(req.body?.paymentMethod || "COD").toUpperCase();

  if (paymentMethod !== "COD") {
    throw httpError(400, "Only Cash on Delivery is available right now");
  }

  // merge duplicate lines so stock checks see the true total quantity
  const merged = new Map();
  for (const item of items) {
    const key = `${item.productId}:${JSON.stringify(item.selectedOptions || {})}`;
    merged.set(key, { ...item, quantity: (merged.get(key)?.quantity || 0) + item.quantity });
  }
  const flatItems = [...merged.values()];

  const products = await loadProducts(flatItems);
  const gstRates = await loadGstRates(products);
  const priced = priceCart(products, flatItems, gstRates);

  // A signed-in shopper's order belongs to their account, which is what
  // makes order history possible. Guests keep the older placeholder record
  // keyed by phone, so checkout still works without an account.
  const session = await getCustomerFromRequest(req);
  let customer = session ? await Customer.findById(session.customerId) : null;

  if (!customer) {
    customer = await Customer.findOneAndUpdate(
      { email: `guest+${address.phone}@cartivo.local` },
      { $set: { name: address.fullName, phone: address.phone } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  const orderNo = await nextOrderNo();

  // Atomically decrement stock for every line, guarding stock >= qty.
  // Any failed decrement aborts the whole order (nothing is half-sold).
  let decremented = [];

  try {
    for (const item of flatItems) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          status: "active",
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        const known = products.find((p) => String(p._id) === item.productId);
        const available = known ? Math.max(0, Number(known.stock || 0)) : 0;
        const err = httpError(409, `Only ${available} left in stock for "${known?.name || "an item"}"`);
        err.stock = available;
        throw err;
      }

      decremented.push({ productId: updated._id, quantity: item.quantity });
    }

    const order = await Order.create({
      orderNo,
      customer: customer._id,
      shippingAddress: address,
      paymentMethod: "COD",
      items: priced.pricedItems,
      subtotal: priced.subtotal,
      gstAmount: priced.gstAmount,
      shipping: priced.shipping,
      total: priced.total,
      status: "PLACED",
      paymentStatus: "PENDING",
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    // roll back any stock already taken in this request
    for (const dec of decremented) {
      await Product.updateOne({ _id: dec.productId }, { $inc: { stock: dec.quantity } });
    }
    throw err;
  }
}

module.exports = { quote, createOrder };
