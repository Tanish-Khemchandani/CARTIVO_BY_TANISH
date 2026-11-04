const { createHash, randomBytes } = require("crypto");
const Customer = require("../models/Customer");
const CustomerSession = require("../models/CustomerSession");
const { COOKIE_NAME, getCookie } = require("../middleware/requireCustomer");
const httpError = require("../utils/httpError");

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // customer sessions: 30 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s]{8,15}$/;

const loginAttempts = new Map();

function cookieOptions(expires) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
    expires,
  };
}

function recordFailure(email) {
  const entry = loginAttempts.get(email) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  loginAttempts.set(email, entry);
}

function clearFailures(email) {
  loginAttempts.delete(email);
}

function assertNotLocked(email) {
  const entry = loginAttempts.get(email);
  if (entry && entry.lockedUntil > Date.now()) {
    const secondsLeft = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    throw httpError(429, `Too many failed attempts. Try again in ${secondsLeft} seconds.`);
  }
}

function cleanEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function cleanName(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

async function register(req, res) {
  const email = cleanEmail(req.body?.email);
  const name = cleanName(req.body?.name);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name) throw httpError(400, "Name is required");
  if (!EMAIL_RE.test(email) || email.length > 254) throw httpError(400, "A valid email is required");
  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    throw httpError(400, `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters`);
  }

  // load the hash/salt columns so the hasPassword virtual can tell a real
  // password account apart from a seeded contact row
  const existing = await Customer.findOne({ email }).select("_id passwordHash passwordSalt");
  if (existing && existing.hasPassword) {
    throw httpError(409, "An account with this email already exists");
  }

  const { salt, hash } = await Customer.setPassword(password);

  let customer;
  if (existing) {
    // the row existed as a contact/lead without a password; attach credentials
    existing.name = name;
    existing.passwordHash = hash;
    existing.passwordSalt = salt;
    customer = await existing.save();
  } else {
    customer = await Customer.create({
      name,
      email,
      passwordHash: hash,
      passwordSalt: salt,
    });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await CustomerSession.create({
    tokenHash: createHash("sha256").update(token).digest("hex"),
    customerId: customer._id,
    expiresAt,
  });
  await Customer.updateOne({ _id: customer._id }, { lastLoginAt: new Date() });

  res.cookie(COOKIE_NAME, token, cookieOptions(expiresAt));
  res.status(201).json({
    success: true,
    data: { id: customer._id, name: customer.name, email: customer.email },
  });
}

async function login(req, res) {
  const email = cleanEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  assertNotLocked(email);

  const customer = await Customer.findOne({ email }).select("+passwordHash +passwordSalt");
  const valid =
    customer &&
    customer.hasPassword &&
    customer.status === "active" &&
    (await Customer.verifyPassword(password, customer.passwordSalt, customer.passwordHash));

  if (!valid) {
    recordFailure(email);
    // Same message for unknown email / wrong password / deactivated account
    // so the endpoint does not leak account existence.
    throw httpError(401, "Email or password is incorrect");
  }

  clearFailures(email);

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await CustomerSession.create({
    tokenHash: createHash("sha256").update(token).digest("hex"),
    customerId: customer._id,
    expiresAt,
  });
  await Customer.updateOne({ _id: customer._id }, { lastLoginAt: new Date() });

  res.cookie(COOKIE_NAME, token, cookieOptions(expiresAt));
  res.json({
    success: true,
    data: { id: customer._id, name: customer.name, email: customer.email },
  });
}

async function me(req, res) {
  // status must be in the projection: it decides whether the session is still valid
  const customer = await Customer.findById(req.customer.customerId).select("name email phone status createdAt");
  if (!customer || customer.status !== "active") {
    throw httpError(401, "Sign in to continue");
  }
  res.json({ success: true, data: customer });
}

// PATCH /api/customer/auth/me - the customer edits their own name and phone.
// Email is the sign-in identity, so it is not editable here.
async function updateProfile(req, res) {
  const customer = await Customer.findById(req.customer.customerId);
  if (!customer) throw httpError(401, "Sign in to continue");

  const name = cleanName(req.body?.name);
  if (!name) throw httpError(400, "Name is required");

  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  if (phone && (phone.length > 20 || !PHONE_RE.test(phone))) {
    throw httpError(400, "Enter a valid phone number");
  }

  customer.name = name;
  customer.phone = phone;
  await customer.save();

  res.json({
    success: true,
    data: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone },
  });
}

// PATCH /api/customer/auth/password - change the password after proving the
// current one. Other devices are signed out; the session making the change stays.
async function changePassword(req, res) {
  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    throw httpError(400, `New password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters`);
  }
  if (newPassword === currentPassword) {
    throw httpError(400, "Choose a password different from your current one");
  }

  const customer = await Customer.findById(req.customer.customerId).select("+passwordHash +passwordSalt");
  if (!customer || customer.status !== "active") throw httpError(401, "Sign in to continue");

  const valid =
    customer.hasPassword &&
    (await Customer.verifyPassword(currentPassword, customer.passwordSalt, customer.passwordHash));
  if (!valid) throw httpError(400, "Your current password is incorrect");

  const { salt, hash } = await Customer.setPassword(newPassword);
  customer.passwordHash = hash;
  customer.passwordSalt = salt;
  await customer.save();

  const token = getCookie(req, COOKIE_NAME);
  const keepTokenHash = token ? createHash("sha256").update(token).digest("hex") : "";
  await CustomerSession.deleteMany({
    customerId: customer._id,
    tokenHash: { $ne: keepTokenHash },
  });

  res.json({ success: true, message: "Password updated" });
}

async function logout(req, res) {
  const token = getCookie(req, COOKIE_NAME);
  if (token) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await CustomerSession.deleteOne({ tokenHash });
  }
  res.clearCookie(COOKIE_NAME, cookieOptions(new Date(0)));
  res.json({ success: true, message: "Signed out" });
}

module.exports = { register, login, me, logout, updateProfile, changePassword };
