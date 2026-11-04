const httpError = require("../utils/httpError");

// Route guard for super-admin-only endpoints. Must run after requireAdmin.
function requireSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== "SUPER_ADMIN") {
    return next(httpError(403, "Super admin access required"));
  }
  next();
}

module.exports = { requireSuperAdmin };
