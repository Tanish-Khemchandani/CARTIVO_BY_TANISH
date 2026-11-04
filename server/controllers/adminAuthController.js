const { createHash, randomBytes } = require("crypto");
const Admin = require("../models/Admin");
const AdminSession = require("../models/AdminSession");
const { COOKIE_NAME, getCookie } = require("../middleware/requireAdmin");
const httpError = require("../utils/httpError");

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 2 * 60 * 1000;

// In-memory per-email failure counter; survives until process restart.
// Keeps brute force off the DB without adding a dependency.
const loginAttempts = new Map();

function cookieOptions(expires) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // scoped to /api, not /api/admin: admin writes also live at
    // /api/products, /api/categories and /api/orders, and a narrower path
    // would stop the browser sending the session cookie to those routes
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

async function login(req, res) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  assertNotLocked(email);

  const admin = await Admin.findOne({ email }).select("+passwordHash +passwordSalt");
  const valid =
    admin &&
    admin.isActive &&
    (await Admin.verifyPassword(password, admin.passwordSalt, admin.passwordHash));

  const demoEmail = String(process.env.DEMO_MANAGER_EMAIL || "").trim().toLowerCase();
  const demoPassword = String(process.env.DEMO_MANAGER_PASSWORD || "");
  const isDemoLogin = Boolean(demoEmail && demoPassword && email === demoEmail);
  if (isDemoLogin && password !== demoPassword) {
    recordFailure(email);
    throw httpError(401, "Email or password is incorrect");
  }

  if (!valid && !isDemoLogin) {
    recordFailure(email);
    // Same message for unknown email / wrong password / deactivated account
    // so the endpoint does not leak account existence.
    throw httpError(401, "Email or password is incorrect");
  }

  clearFailures(email);

  let authenticatedAdmin = admin;
  if (isDemoLogin) {
    const existingDemo = await Admin.findOne({ email: demoEmail }).select("+isDemo");
    if (existingDemo && !existingDemo.isDemo) {
      throw httpError(503, "Demo account email conflicts with an existing administrator");
    }
    if (existingDemo) {
      authenticatedAdmin = existingDemo;
    } else {
      const { salt, hash } = await Admin.setPassword(demoPassword);
      authenticatedAdmin = await Admin.create({
        name: "Demo Manager",
        email: demoEmail,
        passwordHash: hash,
        passwordSalt: salt,
        role: "MANAGER",
        isDemo: true,
      });
    }
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await AdminSession.create({
    tokenHash: createHash("sha256").update(token).digest("hex"),
    adminId: authenticatedAdmin._id,
    expiresAt,
  });

  await Admin.updateOne({ _id: authenticatedAdmin._id }, { lastLoginAt: new Date() });

  res.cookie(COOKIE_NAME, token, cookieOptions(expiresAt));
  res.json({
    success: true,
    data: { email: authenticatedAdmin.email, name: authenticatedAdmin.name, role: authenticatedAdmin.role, isDemo: Boolean(authenticatedAdmin.isDemo) },
  });
}

async function me(req, res) {
  const admin = await Admin.findById(req.admin.adminId).select("name email role isActive +isDemo");
  if (!admin || !admin.isActive) {
    throw httpError(401, "Admin sign-in required");
  }
  res.json({ success: true, data: { email: admin.email, name: admin.name, role: admin.role, isDemo: Boolean(admin.isDemo) } });
}

async function logout(req, res) {
  const token = getCookie(req, COOKIE_NAME);
  if (token) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await AdminSession.deleteOne({ tokenHash });
  }

  res.clearCookie(COOKIE_NAME, cookieOptions(new Date(0)));
  res.json({ success: true, message: "Signed out" });
}

module.exports = { login, me, logout };
