const httpError = require("./httpError");

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

// Every admin list takes the same ?page=&limit=, so paging lives in one place.
function readPaging(query, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const page = Math.max(1, Number.parseInt(query?.page, 10) || 1);
  const requested = Number.parseInt(query?.limit, 10);
  const limit = Math.min(maxLimit, Math.max(1, Number.isFinite(requested) ? requested : defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function toMeta({ page, limit, total }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, pages, hasNext: page < pages, hasPrev: page > 1 };
}

// ?from=&to= are inclusive day boundaries in server-local time, which is what
// the admin sees in the tables. Accepts YYYY-MM-DD or a full ISO timestamp.
function parseDateRange(from, to) {
  const range = {};
  if (from) {
    const start = new Date(from);
    if (Number.isNaN(start.getTime())) throw httpError(400, "Invalid 'from' date");
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(from))) start.setHours(0, 0, 0, 0);
    range.$gte = start;
  }
  if (to) {
    const end = new Date(to);
    if (Number.isNaN(end.getTime())) throw httpError(400, "Invalid 'to' date");
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(to))) end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
}

// start-of-day boundary N days back (inclusive window of N days)
function windowStart(days) {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

// Whichever of these the client sends, never trust it blindly.
function readSort(query, allowed, fallback) {
  const key = String(query?.sort || "");
  return allowed.includes(key) ? key : fallback;
}

module.exports = { readPaging, toMeta, parseDateRange, windowStart, readSort, MAX_LIMIT };
