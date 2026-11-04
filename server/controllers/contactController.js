const ContactInquiry = require("../models/ContactInquiry");
const httpError = require("../utils/httpError");
const escapeRegex = require("../utils/escapeRegex");
const { readPaging, toMeta } = require("../utils/queryFilters");

const INQUIRY_STATUSES = ["NEW", "READ", "IN_PROGRESS", "RESOLVED", "ARCHIVED"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

// POST /api/contact
async function submitInquiry(req, res) {
  const name = text(req.body?.name);
  const email = text(req.body?.email).toLowerCase();
  const phone = text(req.body?.phone);
  const message = text(req.body?.message);

  if (!name || !email || !message) throw httpError(400, "Name, email and message are required");
  if (name.length > 100) throw httpError(400, "Name must be 100 characters or fewer");
  if (email.length > 254 || !EMAIL_RE.test(email)) throw httpError(400, "Enter a valid email address");
  if (phone.length > 30) throw httpError(400, "Phone number is too long");
  if (message.length > 2000) throw httpError(400, "Message must be 2000 characters or fewer");

  const inquiry = await ContactInquiry.create({ name, email, phone, message });
  res.status(201).json({ success: true, data: { id: inquiry._id } });
}

// GET /api/contact  (admin)
// ?status=&search=&page=&limit=
async function listInquiries(req, res) {
  const { status, search } = req.query;
  const { page, limit, skip } = readPaging(req.query, { defaultLimit: 20 });

  const filter = {};
  if (status && INQUIRY_STATUSES.includes(status)) filter.status = status;
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { message: rx }];
  }

  const [inquiries, total, statusCounts] = await Promise.all([
    ContactInquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactInquiry.countDocuments(filter),
    ContactInquiry.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const counts = {};
  for (const inquiryStatus of INQUIRY_STATUSES) counts[inquiryStatus] = 0;
  for (const row of statusCounts) counts[row._id] = row.count;

  res.json({
    success: true,
    data: inquiries,
    meta: {
      ...toMeta({ page, limit, total }),
      statusCounts: counts,
      statuses: INQUIRY_STATUSES,
      open: counts.NEW + counts.READ + counts.IN_PROGRESS,
    },
  });
}

// PATCH /api/contact/:id  (admin) - change status (READ, RESOLVED, etc.)
async function updateInquiryStatus(req, res) {
  const { status } = req.body;
  if (!INQUIRY_STATUSES.includes(status)) {
    throw httpError(400, `Status must be one of ${INQUIRY_STATUSES.join(", ")}`);
  }
  const inquiry = await ContactInquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!inquiry) throw httpError(404, "Inquiry not found");
  res.json({ success: true, data: inquiry });
}

module.exports = { submitInquiry, listInquiries, updateInquiryStatus };
