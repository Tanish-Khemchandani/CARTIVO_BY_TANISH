// Idempotently add ten demonstration products and their original local artwork.
// Run from server/: node seed/addTenProducts.js
// This script only inserts products whose slugs are not already present.
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const slugify = require("../utils/slugify");

const entries = [
  { name: "CARTIVO AirLite Wireless Earbuds", brand: "CARTIVO Audio", category: "electronics", price: 4999, salePrice: 3999, stock: 32, featured: true, options: { Color: ["Midnight", "Cloud White", "Sage"] }, description: "Compact true-wireless earbuds with a pocket-size charging case, clear calls and comfortable silicone tips. Bluetooth pairing is quick, while touch controls keep playback and calls within easy reach. Choose a finish that suits your everyday carry." },
  { name: "Studio ANC Over-Ear Headphones", brand: "CARTIVO Audio", category: "electronics", price: 8999, salePrice: 7499, stock: 20, featured: true, options: { Color: ["Graphite", "Ivory"] }, description: "Soft over-ear cushions and active noise reduction make these headphones a comfortable companion for focused work and long journeys. The folding frame packs neatly into the included carry pouch, and USB-C charging keeps setup simple." },
  { name: "Everyday 20W USB-C Wall Charger", brand: "CARTIVO Tech", category: "electronics", price: 1799, salePrice: 1399, stock: 48, featured: false, options: { Color: ["White", "Black"], Plug: ["India 3-pin"] }, description: "A compact 20W USB-C charger for daily top-ups at home, at work or on the move. Its small footprint leaves neighbouring sockets accessible, and built-in power protection helps keep compatible devices charging safely. USB-C cable sold separately." },
  { name: "CloudSoft Cotton Hoodie", brand: "CARTIVO Wear", category: "fashion", price: 2999, salePrice: 2399, stock: 36, featured: true, options: { Color: ["Oat", "Forest", "Navy"], Size: ["XS", "S", "M", "L", "XL"] }, description: "A relaxed cotton-blend hoodie with a soft brushed interior, an adjustable drawstring hood and a roomy front pocket. The mid-weight fabric layers comfortably through changing weather without feeling bulky. Wash inside out with similar colours." },
  { name: "Everyday Straight-Leg Chino", brand: "CARTIVO Wear", category: "fashion", price: 2499, salePrice: 1999, stock: 29, featured: false, options: { Color: ["Sand", "Charcoal", "Olive"], Size: ["28", "30", "32", "34", "36"] }, description: "An easy straight-leg chino with a clean profile that works with a tee or a button-down. The cotton-rich fabric has a little stretch for comfortable movement, while practical pockets make it suitable for everyday wear. Check the waist measurement when choosing a size." },
  { name: "Luna Ceramic Table Lamp", brand: "CARTIVO Living", category: "home-beauty", price: 3799, salePrice: 3199, stock: 18, featured: true, options: { Color: ["Chalk", "Terracotta"] }, description: "A softly rounded ceramic base and warm fabric shade bring gentle ambient light to a bedside or reading corner. The stable base and simple inline switch make it easy to place and use. Includes a replaceable warm-white LED bulb." },
  { name: "Modular Bamboo Desk Organizer", brand: "CARTIVO Living", category: "furniture", price: 1899, salePrice: 1499, stock: 25, featured: false, options: { Finish: ["Natural Bamboo", "Smoked Oak"] }, description: "A compact modular organizer that gives pens, notes and small desk essentials a defined place. Separate compartments keep frequently used items visible without taking over the work surface. Wipe clean with a dry cloth and keep away from prolonged moisture." },
  { name: "HydraSip Insulated Steel Bottle", brand: "CARTIVO Active", category: "home-beauty", price: 1299, salePrice: 999, stock: 55, featured: true, options: { Color: ["Ocean", "Blush", "Stone"], Capacity: ["500 ml", "750 ml"] }, description: "A double-wall insulated stainless-steel bottle designed for commutes, gym sessions and day trips. The screw top helps prevent leaks in a bag, and the wide opening makes filling and cleaning straightforward. Hand wash to preserve the finish." },
  { name: "Daily Ritual Green Tea Collection", brand: "CARTIVO Pantry", category: "grocery", price: 899, salePrice: 749, stock: 42, featured: false, options: { Pack: ["20 sachets", "40 sachets"] }, description: "A curated set of green tea sachets with a clean, mellow cup for a quiet morning or an afternoon pause. Individually wrapped portions are easy to take along, while the resealable outer pack helps keep the remaining tea fresh. Store in a cool, dry cupboard." },
  { name: "FlexiGrip Yoga Mat", brand: "CARTIVO Active", category: "fashion", price: 2199, salePrice: 1799, stock: 24, featured: true, options: { Color: ["Sage", "Plum", "Slate"], Thickness: ["4 mm", "6 mm"] }, description: "A textured exercise mat gives steady footing for stretches, yoga flows and floor workouts. The cushioned surface is comfortable under knees and elbows, and the flexible material rolls up for storage between sessions. Wipe down after use and air dry fully." },
];

function ensureArtwork(entry) {
  const file = `${slugify(entry.name)}.svg`;
  const directory = path.resolve(__dirname, "../../client/public/assets/generated/products/new-arrivals");
  fs.mkdirSync(directory, { recursive: true });
  const destination = path.join(directory, file);
  if (fs.existsSync(destination)) return `/assets/generated/products/new-arrivals/${file}`;

  const palettes = [
    ["#d9f0f4", "#1689a5", "#102b50"], ["#ece7e2", "#252c38", "#adb8c5"],
    ["#e6edf8", "#527bb7", "#263a5a"], ["#e7eadf", "#637b58", "#283b2d"],
    ["#efe6d8", "#b28b5f", "#45423e"], ["#f1e7df", "#be8067", "#614b45"],
    ["#e8e5db", "#a78054", "#554433"], ["#dceef1", "#3d9aaa", "#214b57"],
    ["#e5efe1", "#73936b", "#344e34"], ["#e9e5f0", "#81769c", "#443c58"],
  ];
  const index = entries.indexOf(entry);
  const [background, accent, dark] = palettes[index];
  const productShapes = [
    '<rect x="355" y="265" width="314" height="440" rx="92" fill="#f7f9fa"/><rect x="378" y="288" width="268" height="360" rx="72" fill="' + accent + '"/><circle cx="447" cy="362" r="25" fill="#fff"/><circle cx="577" cy="362" r="25" fill="#fff"/><path d="M410 548q100 54 200 0" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round"/>',
    '<path d="M270 310q0-45 45-45h364q45 0 45 45v225q0 40-40 55l-60 23H370l-60-23q-40-15-40-55z" fill="' + dark + '"/><path d="M310 338h374v185H310z" rx="18" fill="' + accent + '"/><path d="M375 650h245" stroke="' + dark + '" stroke-width="26" stroke-linecap="round"/>',
    '<rect x="383" y="240" width="258" height="490" rx="42" fill="' + accent + '"/><rect x="405" y="265" width="214" height="438" rx="28" fill="#f8fbff"/><path d="M469 310h112" stroke="' + dark + '" stroke-width="18" stroke-linecap="round"/><rect x="441" y="440" width="142" height="170" rx="16" fill="' + dark + '"/>',
    '<path d="M300 320h424l-48 315q-8 55-62 55H410q-54 0-62-55z" fill="' + accent + '"/><path d="M382 323q0-130 130-130t130 130" fill="none" stroke="' + dark + '" stroke-width="35"/><path d="M380 480h260" stroke="#fff" stroke-width="12" opacity=".55"/>',
    '<path d="M330 285h370l-35 430H365z" fill="' + accent + '"/><path d="M360 320h310v38H360z" fill="' + dark + '"/><path d="M380 430h270" stroke="#fff" stroke-width="15" opacity=".55"/><path d="M395 480h240" stroke="#fff" stroke-width="15" opacity=".55"/>',
    '<path d="M510 320 390 590q-20 48 23 62h198q44-14 23-62L514 320z" fill="' + accent + '"/><path d="M430 605h160v80H430z" rx="12" fill="' + dark + '"/><path d="M430 325h160l-25-130h-110z" fill="#fff" opacity=".78"/>',
    '<rect x="285" y="390" width="430" height="220" rx="24" fill="' + accent + '"/><path d="M325 388v-80q0-28 28-28h294q28 0 28 28v80" fill="none" stroke="' + dark + '" stroke-width="22"/><path d="M335 450h330M335 500h260" stroke="#fff" stroke-width="13" opacity=".6"/>',
    '<rect x="390" y="220" width="240" height="510" rx="90" fill="' + accent + '"/><rect x="405" y="250" width="210" height="360" rx="75" fill="#fff" opacity=".26"/><path d="M455 220v-54h110v54" fill="none" stroke="' + dark + '" stroke-width="22"/><path d="M435 650h150" stroke="' + dark + '" stroke-width="18" stroke-linecap="round"/>',
    '<rect x="320" y="250" width="380" height="440" rx="30" fill="' + accent + '"/><path d="M365 320h290M365 375h260" stroke="#fff" stroke-width="14" opacity=".6"/><circle cx="420" cy="525" r="38" fill="' + dark + '"/><circle cx="510" cy="525" r="38" fill="' + dark + '"/><circle cx="600" cy="525" r="38" fill="' + dark + '"/>',
    '<path d="M340 480q0-120 170-120t170 120l42 186q12 52-40 52H338q-52 0-40-52z" fill="' + accent + '"/><path d="M365 470q20 65 145 65t145-65" fill="none" stroke="#fff" stroke-width="18"/><path d="M350 650h320" stroke="' + dark + '" stroke-width="18"/>',
  ];
  const safeTitle = entry.name.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-labelledby="title"><title id="title">${safeTitle}</title><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="#fff"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="24" stdDeviation="25" flood-color="#172b43" flood-opacity=".16"/></filter></defs><rect width="1024" height="1024" fill="url(#bg)"/><circle cx="820" cy="210" r="170" fill="#fff" opacity=".35"/><ellipse cx="512" cy="785" rx="270" ry="38" fill="#172b43" opacity=".1"/><g filter="url(#shadow)">${productShapes[index]}</g><text x="512" y="875" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="${dark}">CARTIVO  ·  ${entry.brand.toUpperCase()}</text></svg>`;
  fs.writeFileSync(destination, svg);
  return `/assets/generated/products/new-arrivals/${file}`;
}

async function run() {
  for (const entry of entries) entry.image = ensureArtwork(entry);
  if (process.argv.includes("--art-only")) {
    console.log(`Generated ${entries.length} original 1024×1024 product illustrations.`);
    return;
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured.");
  await mongoose.connect(process.env.MONGO_URI);
  const categories = await Category.find({ parent: null }).lean();
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const inserted = [];
  for (const entry of entries) {
    const category = bySlug.get(entry.category);
    if (!category) throw new Error(`Missing top-level category: ${entry.category}`);
    const slug = slugify(entry.name);
    const existing = await Product.findOne({ slug }).select("_id").lean();
    if (existing) continue;
    await Product.create({
      name: entry.name,
      slug,
      brand: entry.brand,
      description: entry.description,
      price: entry.price,
      salePrice: entry.salePrice,
      stock: entry.stock,
      lowStockThreshold: 5,
      category: category._id,
      images: [entry.image],
      options: entry.options,
      featured: entry.featured,
      status: "active",
    });
    inserted.push(entry.name);
  }
  console.log(`Added ${inserted.length} products; existing matching products were left unchanged.`);
  console.log(`New products: ${inserted.join("; ") || "none (already present)"}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(`Product insert stopped: ${error.message}`);
  if (mongoose.connection.readyState) await mongoose.disconnect();
  process.exitCode = 1;
});
