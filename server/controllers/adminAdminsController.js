const Admin = require("../models/Admin");
const AdminSession = require("../models/AdminSession");
const httpError = require("../utils/httpError");

const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
const PUBLIC_FIELDS = "name email role isActive createdAt lastLoginAt";

// Guards used on every action:
// 1. an admin can never demote/deactivate themselves (self-lockout),
// 2. the system must always keep at least one ACTIVE super admin — the check
//    only applies when the TARGET is a super admin whose super-admin status is
//    being removed (demotion, role change, or deactivation).
async function assertRemovalIsSafe(target, actorAdmin) {
  if (String(target._id) === String(actorAdmin.adminId)) {
    throw httpError(400, "You cannot change your own role or deactivate your own account");
  }
  if (actorAdmin.role !== "SUPER_ADMIN") return;
  if (!(target.role === "SUPER_ADMIN" && target.isActive)) return;
  const activeSuperAdmins = await Admin.countDocuments({ role: "SUPER_ADMIN", isActive: true });
  if (activeSuperAdmins <= 1) {
    throw httpError(400, "At least one active super admin must remain");
  }
}

// GET /api/admin/admins
async function listAdmins(req, res) {
  const admins = await Admin.find({}).select(PUBLIC_FIELDS).sort({ createdAt: -1 });
  res.json({ success: true, data: admins });
}

// POST /api/admin/admins
async function createAdmin(req, res) {
  if (req.admin?.isDemo) throw httpError(403, "Demo manager access is read-only");
  const { name, email, password, role } = req.body || {};

  if (typeof name !== "string" || !name.trim()) throw httpError(400, "Name is required");
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw httpError(400, "A valid email is required");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters");
  }
  const finalRole = role || "ADMIN";
  if (!ROLES.includes(finalRole)) throw httpError(400, `Role must be one of: ${ROLES.join(", ")}`);

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await Admin.findOne({ email: normalizedEmail });
  if (existing) throw httpError(409, "An admin with this email already exists");

  const { salt, hash } = await Admin.setPassword(password);
  const admin = await Admin.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    role: finalRole,
  });

  res.status(201).json({ success: true, data: admin.toJSON() });
}

// PATCH /api/admin/admins/:id
async function updateAdmin(req, res) {
  if (req.admin?.isDemo) throw httpError(403, "Demo manager access is read-only");
  const { name, role, isActive, password } = req.body || {};
  const target = await Admin.findById(req.params.id).select("+passwordHash +passwordSalt");
  if (!target) throw httpError(404, "Admin not found");

  const update = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) throw httpError(400, "Name cannot be empty");
    update.name = name.trim();
  }

  if (role !== undefined) {
    if (!ROLES.includes(role)) throw httpError(400, `Role must be one of: ${ROLES.join(", ")}`);
    if (role !== target.role) {
      await assertRemovalIsSafe(target, req.admin);
      update.role = role;
    }
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") throw httpError(400, "isActive must be true or false");
    if (isActive !== target.isActive) {
      await assertRemovalIsSafe(target, req.admin);
      update.isActive = isActive;
    }
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 8) {
      throw httpError(400, "Password must be at least 8 characters");
    }
    const { salt, hash } = await Admin.setPassword(password);
    update.passwordHash = hash;
    update.passwordSalt = salt;
  }

  if (Object.keys(update).length === 0) throw httpError(400, "Nothing to update");

  const admin = await Admin.findByIdAndUpdate(req.params.id, update, {
    returnDocument: "after",
  }).select(PUBLIC_FIELDS);

  // A password reset or deactivation should end any live sessions.
  if (update.passwordHash !== undefined || update.isActive === false) {
    await AdminSession.deleteMany({ adminId: target._id });
  }

  res.json({ success: true, data: admin });
}

module.exports = { listAdmins, createAdmin, updateAdmin };
