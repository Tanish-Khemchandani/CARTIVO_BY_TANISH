const Setting = require("../models/Setting");
const httpError = require("../utils/httpError");

// kept in one place so add/storefront stay in sync on field changes
const PUBLIC_FIELDS = ["siteName", "tagline", "contactEmail", "contactPhone", "address", "supportHours", "footerText", "social"];

// GET /api/admin/settings
async function getAdminSettings(req, res) {
  const settings = await Setting.getSettings();
  res.json({ success: true, data: settings });
}

// PATCH /api/admin/settings
async function updateAdminSettings(req, res) {
  const settings = await Setting.getSettings();
  const body = req.body || {};

  const strings = ["siteName", "tagline", "contactEmail", "contactPhone", "address", "supportHours", "footerText"];
  for (const field of strings) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string") throw httpError(400, `${field} must be text`);
      if (field === "siteName" && !body[field].trim()) throw httpError(400, "Site name cannot be empty");
      settings[field] = body[field].trim();
    }
  }

  if (body.social !== undefined) {
    if (typeof body.social !== "object" || body.social === null || Array.isArray(body.social)) {
      throw httpError(400, "social must be an object of links");
    }
    for (const key of ["facebook", "instagram", "twitter", "youtube"]) {
      if (body.social[key] === undefined) continue;
      if (typeof body.social[key] !== "string") throw httpError(400, `social.${key} must be text`);
      const value = body.social[key].trim();
      if (value && !/^https?:\/\//i.test(value)) throw httpError(400, `social.${key} must start with http:// or https://`);
      settings.social[key] = value;
    }
  }

  // reject unexpected top-level fields so typos fail loudly instead of being lost
  const allowed = new Set([...strings, "social"]);
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) throw httpError(400, `Unknown setting field: ${key}`);
  }

  const updated = await settings.save();
  res.json({ success: true, data: updated });
}

// GET /api/settings  (public, storefront only reads)
async function getPublicSettings(req, res) {
  const settings = await Setting.getSettings();
  res.set("Cache-Control", "public, max-age=120");
  res.json({ success: true, data: PUBLIC_FIELDS.reduce((pick, field) => ({ ...pick, [field]: settings[field] }), {}) });
}

module.exports = { getAdminSettings, updateAdminSettings, getPublicSettings };
