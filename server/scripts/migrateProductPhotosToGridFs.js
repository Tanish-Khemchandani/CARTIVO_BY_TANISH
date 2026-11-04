// One-time migration from legacy server/uploads/products files into MongoDB GridFS.
// Run after backing up MongoDB: node scripts/migrateProductPhotosToGridFs.js
const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { productPhotoBucket } = require("../controllers/imageUploadController");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {
  // Use the system resolver when public resolver configuration is unavailable.
}

const LEGACY_PREFIXES = ["/uploads/products/", "/uploads/"];
const LEGACY_DIRS = [
  path.resolve(__dirname, "../uploads/products"),
  path.resolve(__dirname, "../uploads"),
];
const CLIENT_PUBLIC_DIR = path.resolve(__dirname, "../../client/public");

function contentTypeFor(filename) {
  const extension = path.extname(filename).toLowerCase();
  return extension === ".jpg" || extension === ".jpeg" ? "image/jpeg"
    : extension === ".png" ? "image/png"
      : extension === ".webp" ? "image/webp" : "application/octet-stream";
}

async function uploadFile(filename, locations, metadata) {
  let bytes;
  for (const directory of locations) {
    try {
      bytes = await fs.readFile(path.join(directory, filename));
      break;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  if (!bytes) throw new Error("Source image is missing");
  const bucket = productPhotoBucket();
  const stream = bucket.openUploadStream(filename, {
    contentType: contentTypeFor(filename),
    metadata: { originalName: filename, ...metadata },
  });
  await new Promise((resolve, reject) => {
    stream.end(bytes, (error) => error ? reject(error) : resolve());
  });
  return `/api/uploads/${stream.id}`;
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);
  let productsChanged = 0;
  let imagesMigrated = 0;
  const products = await Product.find({ images: { $regex: "^/(uploads|assets)/" } });

  for (const product of products) {
    const images = [];
    let changed = false;
    for (const image of product.images) {
      const prefix = LEGACY_PREFIXES.find((value) => image.startsWith(value));
      if (prefix) {
        const filename = path.basename(image);
        if (filename !== image.slice(prefix.length)) throw new Error(`Unsafe legacy image path: ${image}`);
        try {
          images.push(await uploadFile(filename, LEGACY_DIRS, { migratedFrom: "server/uploads" }));
          imagesMigrated++;
          changed = true;
        } catch (error) {
          console.error(`Could not migrate ${product._id} / ${filename}: ${error.message}`);
          images.push(image);
        }
        continue;
      }
      if (!image.startsWith("/assets/")) {
        images.push(image);
        continue;
      }
      const relative = image.slice(1);
      const source = path.resolve(CLIENT_PUBLIC_DIR, relative);
      if (!source.startsWith(`${CLIENT_PUBLIC_DIR}${path.sep}`)) throw new Error(`Unsafe asset path: ${image}`);
      try {
        images.push(await uploadFile(path.basename(source), [path.dirname(source)], { migratedFrom: "client/public" }));
        imagesMigrated++;
        changed = true;
      } catch (error) {
        console.error(`Could not migrate ${product._id} / ${filename}: ${error.message}`);
        images.push(image);
      }
    }
    if (changed) {
      product.images = images;
      await product.save();
      productsChanged++;
    }
  }

  console.log(`Migrated ${imagesMigrated} image(s) across ${productsChanged} product(s).`);
  console.log("Legacy files were intentionally retained. Verify the catalog before removing server/uploads/products.");
}

main()
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
