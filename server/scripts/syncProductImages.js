// Safe, repeatable product image sync. Defaults to dry-run; pass --apply to write.
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");

const imageUrl = (slug) => `/assets/generated/products/minimalist/${slug}.webp`;

const existingProducts = [
  ["cast-iron-dutch-oven-non-stick-skillet-set", "Cast Iron Dutch Oven & Non-Stick Skillet Set"],
  ["farm-fresh-organic-hass-avocados-fruit-box", "Farm Fresh Organic Hass Avocados & Fruit Box"],
  ["eco-friendly-plant-based-home-cleaning-care-kit", "Eco-Friendly Plant-Based Home Cleaning Care Kit"],
  ["anker-powercore-20000mah-30w-fast-charging-power-bank", "Anker PowerCore 20000mAh 30W Fast Charging Power Bank"],
  ["organic-himalayan-premium-basmati-rice-5kg", "Organic Himalayan Premium Basmati Rice (5kg)"],
  ["contemporary-abstract-canvas-wall-art-set-of-2", "Contemporary Abstract Canvas Wall Art (Set of 2)"],
  ["sony-playstation-5-console-dualsense-controller", "Sony PlayStation 5 Console & DualSense Controller"],
  ["samsung-324l-double-door-frost-free-refrigerator", "Samsung 324L Double Door Frost Free Refrigerator"],
  ["nordic-minimalist-brass-arch-floor-lamp", "Nordic Minimalist Brass Arch Floor Lamp"],
  ["handcrafted-ceramic-vase-dried-floral-arrangement", "Handcrafted Ceramic Vase & Dried Floral Arrangement"],
  ["pure-egyptian-cotton-400tc-queen-fitted-bedsheet-set", "Pure Egyptian Cotton 400TC Queen Fitted Bedsheet Set"],
  ["sony-bravia-55-inch-4k-ultra-hd-smart-google-tv", "Sony Bravia 55-inch 4K Ultra HD Smart Google TV"],
  ["sandisk-extreme-1tb-portable-external-ssd-1050mb-s", "SanDisk Extreme 1TB Portable External SSD (1050MB/s)"],
  ["bosch-8-kg-5-star-front-load-washing-machine", "Bosch 8 kg 5 Star Front Load Washing Machine"],
  ["luxury-dead-sea-mineral-body-wash-scrub-set", "Luxury Dead Sea Mineral Body Wash & Scrub Set"],
  ["playful-comfort-pure-cotton-kids-summer-set", "Playful Comfort Pure Cotton Kids Summer Set"],
  ["aura-structured-italian-leather-crossbody-bag", "Aura Structured Italian Leather Crossbody Bag"],
  ["realme-gt-6-5g-fluid-silver-256gb", "Realme GT 6 5G (Fluid Silver, 256GB)"],
  ["oneplus-12-5g-flowy-emerald-16gb-ram-512gb", "OnePlus 12 5G (Flowy Emerald, 16GB RAM, 512GB)"],
  ["xiaomi-14-ultra-titanium-white-512gb", "Xiaomi 14 Ultra (Titanium White, 512GB)"],
  ["urban-classic-men-s-quilted-bomber-jacket", "Urban Classic Men's Quilted Bomber Jacket"],
  ["samsung-galaxy-s24-ultra-5g-titanium-black-256gb", "Samsung Galaxy S24 Ultra 5G (Titanium Black, 256GB)"],
  ["apple-iphone-15-pro-128gb-natural-titanium", "Apple iPhone 15 Pro (128GB, Natural Titanium)"],
  ["vivo-x100-pro-5g-asteroid-black-512gb", "Vivo X100 Pro 5G (Asteroid Black, 512GB)"],
].map(([slug, name]) => ({ slug, name, images: [imageUrl(slug)] }));

const sampleProducts = [
  {
    slug: "cartivo-neo-5g-smartphone-graphite-256gb",
    name: "CARTIVO Neo 5G Smartphone (Graphite, 256GB)",
    brand: "CARTIVO",
    description: "A graphite 5G smartphone with a high-resolution display, multi-camera system, and 256GB storage.",
    categorySlug: "mobiles",
    price: 74999,
    salePrice: 69999,
    stock: 25,
    featured: false,
  },
  {
    slug: "everyday-organic-cotton-canvas-tote-bag-natural",
    name: "Everyday Organic Cotton Canvas Tote Bag (Natural)",
    brand: "CARTIVO Fashion",
    description: "A reusable natural cotton-canvas tote with sturdy shoulder straps and a clean, unprinted finish.",
    categorySlug: "fashion",
    price: 1299,
    salePrice: 999,
    stock: 40,
    featured: false,
  },
  {
    slug: "studio-wireless-noise-cancelling-headphones-midnight-black",
    name: "Studio Wireless Noise-Cancelling Headphones (Midnight Black)",
    brand: "CARTIVO Audio",
    description: "Over-ear wireless headphones with padded cups, an adjustable headband, and active-noise-cancelling styling.",
    categorySlug: "electronics",
    price: 9999,
    salePrice: 8499,
    stock: 30,
    featured: false,
  },
  {
    slug: "compact-15l-electric-kettle-matte-white",
    name: "Compact 1.5L Electric Kettle (Matte White)",
    brand: "CARTIVO Home",
    description: "A compact 1.5-liter electric kettle with a matte-white body, stainless-steel base, and water-level window.",
    categorySlug: "appliances",
    price: 2999,
    salePrice: 2499,
    stock: 35,
    featured: false,
  },
  {
    slug: "cartivo-fresh-organic-indian-spice-box-set-of-6",
    name: "CARTIVO Fresh Organic Indian Spice Box (Set of 6)",
    brand: "CARTIVO Fresh",
    description: "Six glass spice jars in a bamboo case, with turmeric, chili, cumin, coriander, mustard, and cardamom.",
    categorySlug: "grocery",
    price: 1499,
    salePrice: 1299,
    stock: 45,
    featured: false,
  },
  {
    slug: "botanical-hydration-skincare-gift-set",
    name: "Botanical Hydration & Skincare Gift Set",
    brand: "CARTIVO Botanical",
    description: "A coordinated botanical skincare set with a hydrating serum, cream, and facial mist.",
    categorySlug: "home-beauty",
    price: 2499,
    salePrice: 1999,
    stock: 30,
    featured: false,
  },
  {
    slug: "solid-oak-minimalist-side-table",
    name: "Solid Oak Minimalist Side Table",
    brand: "CARTIVO Living",
    description: "A compact solid-oak side table with a clean rectangular top, rounded edges, and tapered legs.",
    categorySlug: "furniture",
    price: 8999,
    salePrice: 7499,
    stock: 20,
    featured: false,
  },
].map((product) => ({
  ...product,
  images: [imageUrl(product.slug)],
  status: "active",
  lowStockThreshold: 5,
  rating: 0,
  numReviews: 0,
}));

function imagesEqual(current, desired) {
  return Array.isArray(current) && current.length === desired.length &&
    current.every((value, index) => value === desired[index]);
}

function getPublicAssetPath(url) {
  if (!url.startsWith("/assets/")) throw new Error(`Unsafe image path: ${url}`);
  const publicRoot = path.resolve(__dirname, "../../client/public");
  const localPath = path.resolve(publicRoot, url.slice(1));
  if (!localPath.startsWith(publicRoot + path.sep)) throw new Error(`Image path escapes public assets: ${url}`);
  if (!fs.existsSync(localPath)) throw new Error(`Missing generated image: ${localPath}`);
  return localPath;
}

async function run() {
  const apply = process.argv.includes("--apply");
  if (process.argv.slice(2).some((arg) => arg !== "--apply")) throw new Error("Only the optional --apply flag is supported.");
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured.");

  await mongoose.connect(process.env.MONGO_URI);
  const host = new URL(process.env.MONGO_URI).hostname;
  const target = /^(localhost|127\.0\.0\.1|::1)$/i.test(host) ? "local" : "remote";
  console.log(`Connected to ${target} MongoDB; connection details are suppressed.`);
  console.log(apply ? "Mode: APPLY" : "Mode: DRY-RUN (no database writes)");

  const productCollection = Product.collection;
  const categoryDocs = await Category.find({ parent: null }).lean();
  const categories = new Map(categoryDocs.map((category) => [category.slug, category]));
  const allProducts = await productCollection.find({}, { projection: { slug: 1, name: 1, images: 1, category: 1 } }).toArray();
  const productsBySlug = new Map(allProducts.map((product) => [product.slug, product]));

  const imageUpdates = [];
  for (const expected of existingProducts) {
    getPublicAssetPath(expected.images[0]);
    const current = productsBySlug.get(expected.slug);
    if (!current || current.name !== expected.name) {
      throw new Error(`Existing product did not match expected slug/name: ${expected.slug}`);
    }
    if (!imagesEqual(current.images, expected.images)) imageUpdates.push({ expected, current });
  }

  const samples = [];
  for (const product of sampleProducts) {
    getPublicAssetPath(product.images[0]);
    const category = categories.get(product.categorySlug);
    if (!category || category.parent) throw new Error(`Expected top-level category missing: ${product.categorySlug}`);
    const current = productsBySlug.get(product.slug);
    if (current && current.name !== product.name) {
      throw new Error(`Sample slug already belongs to a different product: ${product.slug}`);
    }
    if (current && String(current.category) !== String(category._id)) {
      throw new Error(`Sample slug exists in a different category; refusing to reassign it: ${product.slug}`);
    }
    samples.push({ product, category, current });
  }

  const sampleInserts = samples.filter((sample) => !sample.current).length;
  const sampleImageUpdates = samples.filter((sample) =>
    sample.current && !imagesEqual(sample.current.images, sample.product.images)
  ).length;
  console.log(`Current catalog: ${allProducts.length} products, ${categoryDocs.length} top-level categories.`);
  console.log(`Planned: ${imageUpdates.length} existing image updates; ${sampleInserts} new sample inserts; ${sampleImageUpdates} image-only updates to existing samples.`);

  if (!apply) return;

  for (const { expected, current } of imageUpdates) {
    const result = await productCollection.updateOne(
      { _id: current._id, slug: expected.slug, name: expected.name },
      { $set: { images: expected.images } }
    );
    if (result.matchedCount !== 1) throw new Error(`Lost product match while updating image: ${expected.slug}`);
  }

  for (const { product, category, current } of samples) {
    if (current) {
      if (!imagesEqual(current.images, product.images)) {
        const result = await productCollection.updateOne(
          { _id: current._id, slug: product.slug, name: product.name },
          { $set: { images: product.images } }
        );
        if (result.matchedCount !== 1) throw new Error(`Lost existing sample while updating image: ${product.slug}`);
      }
      continue;
    }

    const now = new Date();
    const document = {
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      finalPrice: product.salePrice > 0 && product.salePrice < product.price ? product.salePrice : product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      category: category._id,
      images: product.images,
      featured: product.featured,
      status: product.status,
      rating: product.rating,
      numReviews: product.numReviews,
      createdAt: now,
      updatedAt: now,
    };
    await productCollection.updateOne(
      { slug: product.slug },
      { $setOnInsert: document },
      { upsert: true }
    );
  }

  const verifySlugs = [
    ...existingProducts.map((product) => product.slug),
    ...sampleProducts.map((product) => product.slug),
  ];
  const verified = await productCollection.find({ slug: { $in: verifySlugs } }).toArray();
  const verifiedBySlug = new Map(verified.map((product) => [product.slug, product]));
  for (const expected of [...existingProducts, ...sampleProducts]) {
    const product = verifiedBySlug.get(expected.slug);
    if (!product || product.name !== expected.name || !imagesEqual(product.images, expected.images)) {
      throw new Error(`Post-sync verification failed: ${expected.slug}`);
    }
  }
  const finalCount = await productCollection.countDocuments();
  const topLevelSampleCount = await productCollection.countDocuments({
    slug: { $in: sampleProducts.map((product) => product.slug) },
    category: { $in: categoryDocs.map((category) => category._id) },
  });
  console.log(`Verified: all ${verifySlugs.length} named products point to their matching local WebP; catalog now has ${finalCount} products.`);
  console.log(`Verified: ${topLevelSampleCount}/${sampleProducts.length} samples use their intended top-level category.`);
}

run()
  .catch((error) => {
    const details = String(error.message || "operation stopped safely")
      .replace(process.env.MONGO_URI || "\u0000", "[connection string redacted]")
      .replace(/mongodb(?:\+srv)?:\/\/[^\s@]+@/gi, "mongodb://[redacted]@");
    console.error(`Product image sync failed: ${error.name || "Error"}: ${details}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
