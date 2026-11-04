const { createHash } = require("crypto");
const AdminSession = require("../models/AdminSession");

const COOKIE_NAME = "cartivo_admin_session";

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

async function requireAdmin(req, res, next) {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) return res.status(401).json({ success: false, message: "Admin sign-in required" });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = await AdminSession.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).populate("adminId", "name email role isActive +isDemo");
  if (!session || !session.adminId || !session.adminId.isActive) {
    return res.status(401).json({ success: false, message: "Admin sign-in required" });
  }

  req.admin = {
    adminId: session.adminId._id,
    name: session.adminId.name,
    email: session.adminId.email,
    role: session.adminId.role,
    isDemo: Boolean(session.adminId.isDemo),
  };
  req.adminSession = session;
  next();
}

function requireWritableAdmin(req, res, next) {
  if (req.admin?.isDemo) {
    return res.status(403).json({ success: false, message: "Demo manager access is read-only" });
  }
  next();
}

module.exports = { COOKIE_NAME, getCookie, requireAdmin, requireWritableAdmin };
