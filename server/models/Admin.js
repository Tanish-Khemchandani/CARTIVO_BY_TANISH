const mongoose = require("mongoose");
const { scrypt, randomBytes, timingSafeEqual } = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(scrypt);

// K: scrypt key length (bytes). Matches the D1 decision in the dev plan:
// Node built-in crypto.scrypt only, no extra npm packages.
const KEY_LENGTH = 64;

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
      default: "ADMIN",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false, select: false },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.passwordSalt;
        return ret;
      },
    },
  }
);

adminSchema.statics.setPassword = function setPassword(password) {
  // scrypt cost parameters N=16384, r=8, p=1 (OWASP-recommended floor).
  const salt = randomBytes(16).toString("hex");
  return scryptAsync(password, salt, KEY_LENGTH).then((derived) => ({
    salt,
    hash: derived.toString("hex"),
  }));
};

adminSchema.statics.verifyPassword = function verifyPassword(password, salt, expectedHash) {
  return scryptAsync(password, salt, KEY_LENGTH).then((derived) => {
    const stored = Buffer.from(expectedHash, "hex");
    if (stored.length !== derived.length) return false;
    return timingSafeEqual(derived, stored);
  });
};

module.exports = mongoose.model("Admin", adminSchema);
