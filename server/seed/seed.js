// Run with: node seed/seed.js
// Wipes and refills categories + products with sample Cartivo data.
require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const slugify = require("../utils/slugify");
const Category = require("../models/Category");
const Product = require("../models/Product");
const productDescriptions = require("./productDescriptions");
const { productPhotoBucket } = require("../controllers/imageUploadController");

const CLIENT_PUBLIC_DIR = path.resolve(__dirname, "../../client/public");

function contentTypeFor(filename) {
  const extension = path.extname(filename).toLowerCase();
  return extension === ".jpg" || extension === ".jpeg" ? "image/jpeg"
    : extension === ".png" ? "image/png"
      : extension === ".webp" ? "image/webp"
        : extension === ".svg" ? "image/svg+xml" : "application/octet-stream";
}

async function databaseImageUrl(assetUrl, cache) {
  if (assetUrl.startsWith("/api/uploads/")) return assetUrl;
  if (!assetUrl.startsWith("/assets/")) throw new Error(`Unsupported seed image URL: ${assetUrl}`);
  if (cache.has(assetUrl)) return cache.get(assetUrl);

  const relative = assetUrl.slice(1);
  const source = path.resolve(CLIENT_PUBLIC_DIR, relative);
  if (!source.startsWith(`${CLIENT_PUBLIC_DIR}${path.sep}`)) throw new Error(`Unsafe seed image path: ${assetUrl}`);
  const bytes = await fs.readFile(source);
  const bucket = productPhotoBucket();
  const upload = bucket.openUploadStream(path.basename(source), {
    contentType: contentTypeFor(source),
    metadata: { originalName: path.basename(source), seeded: true },
  });
  await new Promise((resolve, reject) => upload.end(bytes, (error) => error ? reject(error) : resolve()));
  const url = `/api/uploads/${upload.id}`;
  cache.set(assetUrl, url);
  return url;
}

const categoryTree = [
  { name: "Mobiles", children: ["Samsung", "Realme", "Apple", "MI", "Vivo", "OnePlus"] },
  { name: "Fashion", children: ["Men", "Women", "Kids"] },
  { name: "Electronics", children: ["Power Bank", "Storage", "Gaming"] },
  { name: "Appliances", children: ["TV", "Refrigerators", "Washing Machines"] },
  { name: "Grocery", children: ["Staples", "Packaging Food", "Household Care"] },
  { name: "Home & Beauty", children: ["Bath", "Home Decor", "Lamp & Lighting"] },
  { name: "Furniture", children: ["Bedsheets", "Home Decor", "Cookware"] },
];

const catalogue = {
  "Mobiles-Apple": {
    name: "Apple iPhone 15 Pro (128GB, Natural Titanium)",
    brand: "Apple",
    price: 134900,
    salePrice: 127900,
    images: ["/assets/generated/products/brand-apple.jpg"],
    description: "Forged in titanium with the industry-leading A17 Pro chip, customisable Action button and 48MP main camera.",
    featured: true,
  },
  "Mobiles-Samsung": {
    name: "Samsung Galaxy S24 Ultra 5G (Titanium Black, 256GB)",
    brand: "Samsung",
    price: 129999,
    salePrice: 119999,
    images: ["/assets/generated/products/brand-samsung.jpg"],
    description: "Galaxy AI is here. Epic 200MP camera, built-in S Pen, and Snapdragon 8 Gen 3 for Galaxy.",
    featured: true,
  },
  "Mobiles-OnePlus": {
    name: "OnePlus 12 5G (Flowy Emerald, 16GB RAM, 512GB)",
    brand: "OnePlus",
    price: 69999,
    salePrice: 64999,
    images: ["/assets/generated/products/brand-oneplus.jpg"],
    description: "Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera, and 5400mAh battery with 100W SUPERVOOC charging.",
    featured: true,
  },
  "Mobiles-Realme": {
    name: "Realme GT 6 5G (Fluid Silver, 256GB)",
    brand: "Realme",
    price: 40999,
    salePrice: 35999,
    images: ["/assets/generated/products/brand-realme.jpg"],
    description: "Flagship killer with Snapdragon 8s Gen 3, 6000-nit ultra-bright display, and Sony 50MP OIS camera.",
    featured: true,
  },
  "Mobiles-Vivo": {
    name: "Vivo X100 Pro 5G (Asteroid Black, 512GB)",
    brand: "Vivo",
    price: 89999,
    salePrice: 79999,
    images: ["/assets/generated/products/brand-vivo.jpg"],
    description: "Co-engineered with ZEISS. 1-inch Sony IMX989 sensor and Dimensity 9300 flagship chip.",
    featured: true,
  },
  "Mobiles-MI": {
    name: "Xiaomi 14 Ultra (Titanium White, 512GB)",
    brand: "Xiaomi",
    price: 99999,
    salePrice: 89999,
    images: ["/assets/generated/products/brand-mi.jpg"],
    description: "Leica Quad Camera with variable aperture, Snapdragon 8 Gen 3, and stunning micro-curved display.",
    featured: true,
  },
  "Appliances-TV": {
    name: "Sony Bravia 55-inch 4K Ultra HD Smart Google TV",
    brand: "Sony",
    price: 64990,
    salePrice: 54990,
    images: ["/assets/generated/products/appliance-tv.jpg"],
    description: "X1 4K HDR Processor, Triluminos Pro display, Dolby Vision and Dolby Atmos sound.",
    featured: true,
  },
  "Appliances-Refrigerators": {
    name: "Samsung 324L Double Door Frost Free Refrigerator",
    brand: "Samsung",
    price: 38990,
    salePrice: 32490,
    images: ["/assets/generated/products/appliance-refrigerator.jpg"],
    description: "Twin Cooling Plus technology with 5 conversion modes and digital inverter compressor.",
    featured: true,
  },
  "Appliances-Washing Machines": {
    name: "Bosch 8 kg 5 Star Front Load Washing Machine",
    brand: "Bosch",
    price: 42990,
    salePrice: 36990,
    images: ["/assets/generated/products/appliance-washing-machine.jpg"],
    description: "EcoSilence Drive, Anti-Stain technology, and hygienic Steam Wash with ActiveWater Plus.",
    featured: true,
  },
  "Electronics-Gaming": {
    name: "Sony PlayStation 5 Console & DualSense Controller",
    brand: "Sony",
    price: 49990,
    salePrice: 44990,
    images: ["/assets/generated/products/electronics-gaming.jpg"],
    description: "Lightning-fast loading with an ultra-high speed SSD, deeper immersion with haptic feedback.",
    featured: true,
  },
  "Electronics-Storage": {
    name: "SanDisk Extreme 1TB Portable External SSD (1050MB/s)",
    brand: "SanDisk",
    price: 12999,
    salePrice: 9499,
    images: ["/assets/generated/products/electronics-storage.jpg"],
    description: "Fast NVMe solid state performance featuring 1050MB/s read and 1000MB/s write speeds, IP55 rated.",
    featured: true,
  },
  "Electronics-Power Bank": {
    name: "Anker PowerCore 20000mAh 30W Fast Charging Power Bank",
    brand: "Anker",
    price: 3999,
    salePrice: 2799,
    images: ["/assets/generated/products/electronics-powerbank.jpg"],
    description: "Massive 20,000mAh capacity delivers multiple charges with PowerIQ 3.0 high-speed USB-C output.",
    featured: true,
  },
  "Fashion-Men": {
    name: "Urban Classic Men's Quilted Bomber Jacket",
    brand: "Cartivo Fashion",
    price: 3499,
    salePrice: 2299,
    images: ["/assets/generated/products/fashion-men.jpg"],
    description: "Premium windproof cotton-twill blend, ribbed cuffs and collar with interior secure pockets.",
    featured: true,
  },
  "Fashion-Women": {
    name: "Aura Structured Italian Leather Crossbody Bag",
    brand: "Cartivo Fashion",
    price: 4999,
    salePrice: 3499,
    images: ["/assets/generated/products/fashion-women.jpg"],
    description: "Handcrafted pebble-grain leather with gold-tone hardware and adjustable strap.",
    featured: true,
  },
  "Fashion-Kids": {
    name: "Playful Comfort Pure Cotton Kids Summer Set",
    brand: "Cartivo Kids",
    price: 1499,
    salePrice: 999,
    images: ["/assets/generated/products/fashion-kids.jpg"],
    description: "100% breathable organic combed cotton with non-fade eco dyes.",
    featured: true,
  },
  "Grocery-Staples": {
    name: "Organic Himalayan Premium Basmati Rice (5kg)",
    brand: "Cartivo Fresh",
    price: 699,
    salePrice: 549,
    images: ["/assets/brand/product-placeholder.svg"],
    description: "Aged long-grain aromatic basmati rice straight from Himalayan foothills.",
    featured: false,
  },
  "Grocery-Packaging Food": {
    name: "Farm Fresh Organic Hass Avocados & Fruit Box",
    brand: "Cartivo Fresh",
    price: 499,
    salePrice: 399,
    images: ["/assets/brand/product-placeholder.svg"],
    description: "Handpicked premium organic seasonal fruits packed hygienically.",
    featured: false,
  },
  "Grocery-Household Care": {
    name: "Eco-Friendly Plant-Based Home Cleaning Care Kit",
    brand: "Cartivo Home",
    price: 899,
    salePrice: 699,
    images: ["/assets/brand/product-placeholder.svg"],
    description: "Non-toxic, biodegradable surface cleaner, laundry wash and dish wash kit.",
    featured: false,
  },
  "Home & Beauty-Bath": {
    name: "Luxury Dead Sea Mineral Body Wash & Scrub Set",
    brand: "Botanical Spa",
    price: 1299,
    salePrice: 999,
    images: ["/assets/brand/product-placeholder.svg"],
    description: "Infused with therapeutic essential oils, sea salt, and aloe vera.",
    featured: false,
  },
  "Home & Beauty-Home Decor": {
    name: "Handcrafted Ceramic Vase & Dried Floral Arrangement",
    brand: "Cartivo Living",
    price: 1999,
    salePrice: 1499,
    images: ["/assets/brand/product-placeholder.svg"],
    description: "Minimalist Scandinavian matte glazed ceramic vase with pampas grass bouquet.",
    featured: false,
  },
  "Home & Beauty-Lamp & Lighting": {
    name: "Nordic Minimalist Brass Arch Floor Lamp",
    brand: "Lumiere",
    price: 4999,
    salePrice: 3899,
    images: ["/assets/brand/product-placeholder.svg"],
    description: "Warm LED dimmable floor lamp with satin brass finish and heavy marble base.",
    featured: true,
  },
  "Furniture-Bedsheets": {
    name: "Pure Egyptian Cotton 400TC Queen Fitted Bedsheet Set",
    brand: "Luxe Linen",
    price: 2499,
    salePrice: 1799,
    images: ["/assets/brand/product-placeholder.svg"],
    description: "Ultra-soft sateen weave breathable pure combed cotton bedsheet with two pillowcases.",
    featured: false,
  },
  "Furniture-Home Decor": {
    name: "Contemporary Abstract Canvas Wall Art (Set of 2)",
    brand: "Artisan Studio",
    price: 3299,
    salePrice: 2499,
    images: ["/assets/brand/product-placeholder.svg"],
    description: "Framed modern gallery-wrapped museum canvas art in rich navy and gold accents.",
    featured: false,
  },
  "Furniture-Cookware": {
    name: "Cast Iron Dutch Oven & Non-Stick Skillet Set",
    brand: "ChefPro",
    price: 5499,
    salePrice: 4299,
    images: ["/assets/brand/product-placeholder.svg"],
    description: "Pre-seasoned multi-ply stainless steel and enameled cast iron cookware set.",
    featured: true,
  },
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected, seeding...");

  await Product.deleteMany({});
  await Category.deleteMany({});

  const products = [];
  const imageCache = new Map();
  let sortOrder = 0;

  for (const top of categoryTree) {
    const parent = await Category.create({
      name: top.name,
      slug: slugify(top.name),
      sortOrder: sortOrder++,
    });

    let childOrder = 0;
    for (const childName of top.children) {
      const child = await Category.create({
        name: childName,
        slug: slugify(`${top.name}-${childName}`),
        parent: parent._id,
        sortOrder: childOrder++,
      });

      const key = `${top.name}-${childName}`;
      const item = catalogue[key] || {
        name: `${top.name} ${childName}`,
        brand: top.name,
        price: 2999,
        salePrice: 2499,
        images: ["/assets/generated/products/fashion-men.jpg"],
        description: `Authentic ${childName} product under ${top.name}.`,
        featured: true,
      };

      products.push({
        name: item.name,
        brand: item.brand || top.name,
        price: item.price,
        salePrice: item.salePrice,
        stock: 35,
        category: child._id,
        images: await Promise.all(item.images.map((image) => databaseImageUrl(image, imageCache))),
        featured: item.featured ?? true,
        // extended "About this product" copy wins over the short seed line
        description: productDescriptions[slugify(item.name)] || item.description,
      });
    }
  }

  await Product.insertMany(products);

  console.log(`Seeded ${categoryTree.length} top-level categories and ${products.length} products.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
