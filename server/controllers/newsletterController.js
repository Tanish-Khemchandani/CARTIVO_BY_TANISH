const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const httpError = require("../utils/httpError");

// POST /api/newsletter/subscribe
async function subscribe(req, res) {
  const { email } = req.body;
  if (typeof email !== "string") throw httpError(400, "A valid email address is required");

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw httpError(400, "A valid email address is required");
  }

  const existing = await NewsletterSubscriber.findOne({ email: normalizedEmail });
  if (existing) return res.json({ success: true, data: existing, message: "Already subscribed" });

  const subscriber = await NewsletterSubscriber.create({ email: normalizedEmail });
  res.status(201).json({ success: true, data: subscriber });
}

module.exports = { subscribe };
