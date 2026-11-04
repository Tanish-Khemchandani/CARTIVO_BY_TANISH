require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Some Windows/ISP resolvers refuse or drop DNS SRV lookups, which breaks the
// mongodb+srv connection string before it ever reaches Atlas. Point Node at
// public resolvers first (no-op when the system resolver already works).
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {
  // keep the system resolver if setting servers is unavailable
}

const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const customerAuthRoutes = require("./routes/customerAuthRoutes");
const addressRoutes = require("./routes/addressRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const clientDist = path.resolve(__dirname, "../client/dist");

if (process.env.NODE_ENV !== "production") {
  // Vite picks the next free port when 5173 is taken (5174, 5175, ...), so
  // loopback origins are allowed on any port in development. LAN hosts stay
  // pinned to 5173 because that is the documented `--host` dev URL.
  const isLocalDevelopmentOrigin = (origin) => {
    try {
      const url = new URL(origin);
      if (url.protocol !== "http:") return false;
      if (["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname)) return true;
      return url.port === "5173" && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(url.hostname);
    } catch {
      return false;
    }
  };
  app.use(cors({
    origin(origin, callback) {
      if (!origin || isLocalDevelopmentOrigin(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  }));
}
app.use(express.json());

// Render's health check and UptimeRobot can both use this path.
app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({ success: true, message: "Cartivo is running" });
});

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/customer/auth", customerAuthRoutes);
app.use("/api/customer/addresses", addressRoutes);
app.use("/api/settings", settingsRoutes);

// In production, Express serves the Vite build and supports client-side routes.
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path === "/api" || req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use(notFound);
app.use(errorHandler);

const configuredPort = Number(process.env.PORT);
const PORT = Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
  })
  .catch(() => {
    console.error("MongoDB connection failed");
    process.exit(1);
  });
