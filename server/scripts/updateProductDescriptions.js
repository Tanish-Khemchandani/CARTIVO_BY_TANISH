// Backfill: writes the extended "About this product" copy into an existing
// catalog without touching prices, stock, images or orders.
// Run: node scripts/updateProductDescriptions.js
require("dotenv").config();

// Some Windows/ISP resolvers refuse DNS SRV lookups for mongodb+srv; the
// server does the same at startup.
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {
  // keep the system resolver if setServers is unavailable
}

const mongoose = require("mongoose");
const Product = require("../models/Product");
const productDescriptions = require("../seed/productDescriptions");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  let updated = 0;
  let skipped = 0;
  const missing = [];

  for (const [slug, description] of Object.entries(productDescriptions)) {
    const existing = await Product.findOne({ slug }).select("slug description");
    if (!existing) {
      missing.push(slug);
      continue;
    }
    if (existing.description === description) {
      skipped += 1;
      continue;
    }
    await Product.updateOne({ slug }, { $set: { description } });
    updated += 1;
  }

  console.log(`descriptions updated: ${updated}, already current: ${skipped}`);
  if (missing.length) console.log("not in catalog:", missing.join(", "));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
