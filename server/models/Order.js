const mongoose = require("mongoose");

const ORDER_STATUSES = [
  "IN_CHECKOUT",
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
];

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    // name/price are copied at order time so an old order never
    // changes just because the product was edited or deleted later
    name: { type: String, required: true },
    price: { type: Number, required: true },
    selectedOptions: { type: Map, of: String, default: {} },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    shippingAddress: shippingAddressSchema,
    paymentMethod: { type: String, enum: ["COD"], default: "COD" },
    items: [orderItemSchema],
    subtotal: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: "IN_CHECKOUT" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "PENDING" },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
Order.ORDER_STATUSES = ORDER_STATUSES;
Order.PAYMENT_STATUSES = PAYMENT_STATUSES;

module.exports = Order;
