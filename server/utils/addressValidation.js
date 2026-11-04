const httpError = require("./httpError");

const PINCODE_RE = /^[1-9][0-9]{5}$/;
const PHONE_RE = /^[0-9+\-\s]{8,15}$/;

const REQUIRED_FIELDS = ["fullName", "phone", "line1", "city", "state", "pincode"];

/*
 * One validator for every delivery address the store accepts: checkout
 * (stored on the order) and the customer address book. Keeping it here
 * means a saved address can never be one that checkout would reject.
 */
function sanitizeAddress(raw) {
  const address = {
    fullName: String(raw?.fullName || "").trim(),
    phone: String(raw?.phone || "").trim(),
    line1: String(raw?.line1 || "").trim(),
    line2: String(raw?.line2 || "").trim(),
    city: String(raw?.city || "").trim(),
    state: String(raw?.state || "").trim(),
    pincode: String(raw?.pincode || "").trim(),
  };

  const missing = REQUIRED_FIELDS.filter((field) => !address[field]);
  if (missing.length) {
    throw httpError(400, `Missing address fields: ${missing.join(", ")}`);
  }
  if (address.fullName.length > 100) throw httpError(400, "Name is too long");
  if ([address.phone, address.city, address.state].some((value) => !value || value.length > 60)) {
    throw httpError(400, "Address value too long");
  }
  if (address.line1.length > 200) throw httpError(400, "Address line too long");
  if (address.line2.length > 200) throw httpError(400, "Address line too long");
  if (!PINCODE_RE.test(address.pincode)) throw httpError(400, "Invalid pincode");
  if (!PHONE_RE.test(address.phone)) throw httpError(400, "Invalid phone number");

  return address;
}

module.exports = { sanitizeAddress, PINCODE_RE, PHONE_RE };
