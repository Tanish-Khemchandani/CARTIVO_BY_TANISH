const mongoose = require("mongoose");
const { scrypt, randomBytes, timingSafeEqual } = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(scrypt);

// Same scrypt parameters as Admin (decision D1): built-in crypto only,
// no extra npm packages.
const KEY_LENGTH = 64;

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, default: "" },
    passwordSalt: { type: String, default: "" },
    // customers without a password (seeded contacts) cannot sign in until
    // they register properly; hasPassword distinguishes them
    phone: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
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

// legacy rows created before auth existed: they have no password yet
customerSchema.virtual("hasPassword").get(function hasPassword() {
  return Boolean(this.passwordHash && this.passwordSalt);
});

customerSchema.statics.setPassword = function setPassword(password) {
  // scrypt cost parameters N=16384, r=8, p=1 (OWASP-recommended floor).
  const salt = randomBytes(16).toString("hex");
  return scryptAsync(password, salt, KEY_LENGTH).then((derived) => ({
    salt,
    hash: derived.toString("hex"),
  }));
};

customerSchema.statics.verifyPassword = function verifyPassword(password, salt, expectedHash) {
  return scryptAsync(password, salt, KEY_LENGTH).then((derived) => {
    const stored = Buffer.from(expectedHash, "hex");
    if (stored.length !== derived.length) return false;
    return timingSafeEqual(derived, stored);
  });
};

module.exports = mongoose.model("Customer", customerSchema);
