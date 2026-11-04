// Creates a starting set of category-level GST rules so checkout has rates to
// use out of the box. Safe to re-run: a category that already has an active
// immediate rule is skipped, so edits made in the admin GST manager win.
//
// Run: node scripts/seedGstRules.js
// Rates are ordinary Indian slabs and can be changed in /admin/gst.
require("dotenv").config();

// Some Windows/ISP resolvers refuse DNS SRV lookups for mongodb+srv; the
// server does the same at startup.
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {
  // keep the system resolver if setServers is unavailable
}

const mongoose = require("mongoose");
const Category = require("../models/Category");
const GstRule = require("../models/GstRule");

const DEFAULTS = [
  { category: "Mobiles", rate: 18 },
  { category: "Fashion", rate: 12 },
  { category: "Electronics", rate: 18 },
  { category: "Appliances", rate: 18 },
  { category: "Grocery", rate: 5 },
  { category: "Home & Beauty", rate: 12 },
  { category: "Furniture", rate: 12 },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const categories = await Category.find({ parent: null }).select("name").lean();
  const byName = new Map(categories.map((category) => [category.name, category]));

  let created = 0;
  let skipped = 0;

  for (const entry of DEFAULTS) {
    const category = byName.get(entry.category);
    if (!category) {
      console.log(`skip ${entry.category}: category not found`);
      continue;
    }

    const existing = await GstRule.findOne({
      scope: "category",
      category: category._id,
      active: true,
      effectiveFrom: null,
    });
    if (existing) {
      console.log(`skip ${entry.category}: already has "${existing.name}" (${existing.rate}%)`);
      skipped += 1;
      continue;
    }

    await GstRule.create({
      name: `${entry.category} ${entry.rate}% GST`,
      rate: entry.rate,
      scope: "category",
      category: category._id,
      active: true,
      effectiveFrom: null,
    });
    console.log(`created ${entry.category} ${entry.rate}% GST`);
    created += 1;
  }

  console.log(`\ndone: ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
})().catch((error) => {
  console.error("failed:", error.message);
  process.exit(1);
});
