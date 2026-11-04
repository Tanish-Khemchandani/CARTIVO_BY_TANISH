const mongoose = require("mongoose");
const Address = require("../models/Address");
const httpError = require("../utils/httpError");
const { sanitizeAddress } = require("../utils/addressValidation");

const MAX_ADDRESSES = 10;

// GET /api/customer/addresses
async function listAddresses(req, res) {
  const addresses = await Address.find({ customer: req.customer.customerId }).sort({
    isDefault: -1,
    createdAt: -1,
  });
  res.json({ success: true, data: addresses, meta: { max: MAX_ADDRESSES } });
}

// POST /api/customer/addresses
async function createAddress(req, res) {
  const customerId = req.customer.customerId;

  const count = await Address.countDocuments({ customer: customerId });
  if (count >= MAX_ADDRESSES) {
    throw httpError(400, `You can save up to ${MAX_ADDRESSES} addresses`);
  }

  const fields = sanitizeAddress(req.body);
  // the first address is always the default; after that the customer chooses
  const isDefault = req.body?.isDefault === true || count === 0;

  if (isDefault) {
    await Address.updateMany({ customer: customerId, isDefault: true }, { $set: { isDefault: false } });
  }

  const address = await Address.create({ ...fields, customer: customerId, isDefault });
  res.status(201).json({ success: true, data: address });
}

// PATCH /api/customer/addresses/:id - partial update of the fields and/or the default flag
async function updateAddress(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "Invalid address id");

  const customerId = req.customer.customerId;
  const address = await Address.findOne({ _id: req.params.id, customer: customerId });
  if (!address) throw httpError(404, "Address not found");

  // validate the merged result, not just the patch, so a partial update can
  // never leave an invalid address behind
  const fields = sanitizeAddress({ ...address.toObject(), ...req.body });
  address.set(fields);

  if (req.body?.isDefault === true) {
    await Address.updateMany(
      { customer: customerId, isDefault: true, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );
    address.isDefault = true;
  } else if (req.body?.isDefault === false) {
    address.isDefault = false;
  }

  await address.save();
  res.json({ success: true, data: address });
}

// DELETE /api/customer/addresses/:id
async function removeAddress(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "Invalid address id");

  const customerId = req.customer.customerId;
  const address = await Address.findOneAndDelete({ _id: req.params.id, customer: customerId });
  if (!address) throw httpError(404, "Address not found");

  // deleting the default promotes the newest remaining address, so the
  // address book never ends up without a default
  if (address.isDefault) {
    const next = await Address.findOne({ customer: customerId }).sort({ createdAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  res.json({ success: true, data: { id: address._id } });
}

module.exports = { listAddresses, createAddress, updateAddress, removeAddress, MAX_ADDRESSES };
