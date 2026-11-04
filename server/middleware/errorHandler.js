function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express 5 forwards errors thrown in async handlers here automatically
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Something went wrong";

  // bad ObjectId in the URL, e.g. /api/products/abc
  if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  }

  // duplicate key, e.g. two categories with the same slug
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `That ${field} is already in use`;
  }

  if (status === 500) {
    console.error("Request failed", { name: err.name, code: err.code || undefined });
  }

  res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
