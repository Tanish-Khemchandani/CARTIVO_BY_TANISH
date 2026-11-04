const { createHash } = require("crypto");
const CustomerSession = require("../models/CustomerSession");

const COOKIE_NAME = "cartivo_customer_session";

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const entry = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!entry) return "";
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    return "";
  }
}

// Same cookie helper as requireAdmin; used by optionalCustomer too.
function requireCustomer(req, res, next) {
  getCustomerFromRequest(req)
    .then((customer) => {
      if (!customer) {
        return res.status(401).json({ success: false, message: "Sign in to continue" });
      }
      next();
    })
    .catch(next);
}

// Hardens the shared token-hash path: never treat a nonexistent/vanished
// session as a silent null for protected routes.
async function getCustomerFromRequest(req) {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) return null;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = await CustomerSession.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  }).populate("customerId", "name email phone status createdAt lastLoginAt");

  if (!session || !session.customerId || session.customerId.status !== "active") return null;

  req.customer = {
    customerId: session.customerId._id,
    name: session.customerId.name,
    email: session.customerId.email,
    phone: session.customerId.phone,
  };
  req.customerSession = session;
  return session;
}

module.exports = { COOKIE_NAME, getCookie, requireCustomer, getCustomerFromRequest };
