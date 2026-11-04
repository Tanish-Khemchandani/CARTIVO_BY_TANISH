const GstRule = require("../models/GstRule");
const httpError = require("../utils/httpError");

// GET /api/admin/gst
async function listGstRules(req, res) {
  const rules = await GstRule.find({}).populate("category", "name slug").populate("product", "name slug").sort({ createdAt: -1 });
  res.json({ success: true, data: rules });
}

// keep the payload small and explicit instead of trusting the whole body
async function readRuleFields(body, { forCreate }) {
  const fields = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) throw httpError(400, "Rule name cannot be empty");
    fields.name = body.name.trim();
  }
  if (body.rate !== undefined) {
    const rate = Number(body.rate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw httpError(400, "Rate must be between 0 and 100");
    fields.rate = Math.round(rate * 100) / 100;
  }
  if (body.scope !== undefined) {
    if (!["category", "product"].includes(body.scope)) throw httpError(400, "Scope must be category or product");
    fields.scope = body.scope;
  }
  if (body.category !== undefined) fields.category = body.category || null;
  if (body.product !== undefined) fields.product = body.product || null;
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") throw httpError(400, "active must be a boolean");
    fields.active = body.active;
  }
  if (body.effectiveFrom !== undefined) {
    if (body.effectiveFrom === null || body.effectiveFrom === "") {
      fields.effectiveFrom = null;
    } else {
      const date = new Date(body.effectiveFrom);
      if (Number.isNaN(date.getTime())) throw httpError(400, "Effective date is not a valid date");
      fields.effectiveFrom = date;
    }
  }

  if (forCreate) {
    if (!fields.name || fields.rate === undefined || !fields.scope) {
      throw httpError(400, "name, rate and scope are required");
    }
  }
  return fields;
}

// reject more than one active rule on the same target, so pricing never has
// to guess between overlapping rates
async function assertNoActiveDuplicate(source, fields, excludeId) {
  const scope = fields.scope ?? source.scope;
  const target = scope === "category" ? (fields.category ?? source.category) : (fields.product ?? source.product);
  const active = fields.active ?? source.active;
  if (!target || !active) return;

  const query = {
    _id: excludeId ? { $ne: excludeId } : undefined,
    scope,
    active: true,
    effectiveFrom: { $in: [null, undefined] },
  };
  query[scope] = target;

  const clash = await GstRule.findOne(query);
  if (clash) throw httpError(409, `${scope === "category" ? "This category" : "This product"} already has an active immediate rule`);
}

// POST /api/admin/gst
async function createGstRule(req, res) {
  const fields = await readRuleFields(req.body, { forCreate: true });
  await assertNoActiveDuplicate({ ...fields }, fields);

  const rule = await GstRule.create(fields);
  res.status(201).json({ success: true, data: rule });
}

// PATCH /api/admin/gst/:id
async function updateGstRule(req, res) {
  const rule = await GstRule.findById(req.params.id);
  if (!rule) throw httpError(404, "GST rule not found");

  const fields = await readRuleFields(req.body, { forCreate: false });
  if (Object.keys(fields).length === 0) throw httpError(400, "Nothing to update");

  await assertNoActiveDuplicate(rule, fields, rule._id);
  Object.assign(rule, fields);
  const updated = await rule.save();
  res.json({ success: true, data: updated });
}

// DELETE /api/admin/gst/:id
async function deleteGstRule(req, res) {
  const rule = await GstRule.findByIdAndDelete(req.params.id);
  if (!rule) throw httpError(404, "GST rule not found");
  res.json({ success: true, data: { _id: rule._id } });
}

module.exports = { listGstRules, createGstRule, updateGstRule, deleteGstRule };
