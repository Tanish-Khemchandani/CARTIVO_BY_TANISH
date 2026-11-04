// Product photos live in MongoDB GridFS. The admin portal uses this controller
// to write the image bytes and products retain only the database-backed URL.
//
// Every uploaded photo must be:
//   - a real JPEG/PNG/WebP (magic-byte sniffed, not just the filename)
//   - at least 400x400 and at most 4000x4000
//   - exact duplicate bytes are rejected within the same request
//
const crypto = require("crypto");
const mongoose = require("mongoose");
const { Readable } = require("stream");
const httpError = require("../utils/httpError");

const BUCKET_NAME = "productPhotos";
const PUBLIC_PREFIX = "/api/uploads";

const MIN_DIMENSION = 400;
const MAX_DIMENSION = 4000;
const MIN_BYTES = 8 * 1024;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MIN_REQUIRED_IMAGES = 3;

const MAGIC = {
  jpg: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  png: (bytes) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47,
  webp: (bytes) =>
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50,
};

async function sniffImage(buffer) {
  if (!buffer || buffer.length < 16) return null;
  if (MAGIC.jpg(buffer)) return "jpg";
  if (MAGIC.png(buffer)) return "png";
  if (MAGIC.webp(buffer)) return "webp";
  return null;
}

// Estimate pixel dimensions straight from the file header:
//   PNG: IHDR at bytes 16-24
//   JPEG: scan SOF0/SOF2 markers
//   WebP: VP8/VP8L/VP8X payload
function readDimensions(buffer, format) {
  try {
    if (format === "png") {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (format === "jpg") {
      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = buffer[offset + 1];
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || marker === 0xc3) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
      return null;
    }
    if (format === "webp") {
      const chunk = buffer.toString("latin1", 12, 16);
      if (chunk === "VP8 ") {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
      }
      if (chunk === "VP8L") {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (chunk === "VP8X") {
        return {
          width: 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)),
          height: 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)),
        };
      }
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

// A stable content fingerprint. Pixel-level near-duplicate detection runs in
// the admin browser where the image decoder is available. The server must not
// pretend compressed file bytes are pixels; it enforces exact duplicate
// rejection independently so clients cannot upload the same bytes twice.
function contentFingerprint(buffer, format) {
  if (!buffer || !buffer.length || !format) return null;
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function productPhotoBucket() {
  if (!mongoose.connection.db) throw httpError(503, "Database is not connected");
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
}

function photoIdFromUrl(url) {
  const match = /^\/api\/uploads\/([a-f\d]{24})$/i.exec(String(url));
  return match ? new mongoose.Types.ObjectId(match[1]) : null;
}

async function deleteUnreferencedProductPhotos(urls) {
  const candidates = urls.map(photoIdFromUrl).filter(Boolean);
  if (!candidates.length) return;
  const Product = require("../models/Product");
  const bucket = productPhotoBucket();
  for (const id of candidates) {
    const url = `${PUBLIC_PREFIX}/${id}`;
    const stillUsed = await Product.exists({ images: url });
    if (!stillUsed) await bucket.delete(id).catch(() => {});
  }
}

async function saveBuffer(buffer, format, file) {
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${format}`;
  const bucket = productPhotoBucket();
  const upload = bucket.openUploadStream(filename, {
    contentType: `image/${format === "jpg" ? "jpeg" : format}`,
    metadata: {
      originalName: file.originalname,
      bytes: file.size,
      format,
    },
  });
  await new Promise((resolve, reject) => {
    Readable.from(buffer).pipe(upload).on("finish", resolve).on("error", reject);
  });
  return `${PUBLIC_PREFIX}/${upload.id}`;
}

// POST /api/uploads (admin; multipart/form-data, field "images", multiple)
// returns { data: [{ url, width, height, bytes, name, index }] }
async function uploadImages(req, res) {
  const files = req.files || [];
  if (files.length === 0) throw httpError(400, "No images were sent");

  const accepted = [];
  const rejected = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    try {
      if (file.size < MIN_BYTES) throw httpError(400, "Photo is too small to be a real product photo (min 8 KB)");
      if (file.size > MAX_BYTES) throw httpError(400, "Photo is larger than 8 MB");

      const format = await sniffImage(file.buffer);
      if (!format) throw httpError(400, "Only real JPG, PNG or WebP photos are accepted");

      const dims = readDimensions(file.buffer, format);
      if (!dims || !dims.width || !dims.height) throw httpError(400, "Could not read the photo dimensions");
      if (dims.width < MIN_DIMENSION || dims.height < MIN_DIMENSION) {
        throw httpError(400, `Photo is too small (${dims.width}x${dims.height}); minimum is ${MIN_DIMENSION}x${MIN_DIMENSION}`);
      }
      if (dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) {
        throw httpError(400, `Photo is too large (${dims.width}x${dims.height}); maximum is ${MAX_DIMENSION}x${MAX_DIMENSION}`);
      }

      // Exact duplicate enforcement on the server; browser-side perceptual
      // hashes provide the user-friendly near-duplicate check.
      const hash = contentFingerprint(file.buffer, format);
      if (!hash) throw httpError(400, "Could not analyze this photo");
      for (const prev of accepted) {
        if (hash === prev.hash) {
          throw httpError(409, "The same photo was selected more than once");
        }
      }

      const url = await saveBuffer(file.buffer, format, file);
      accepted.push({ url, width: dims.width, height: dims.height, bytes: file.size, name: file.originalname, index, hash });
    } catch (err) {
      rejected.push({ file: file.originalname, message: err.message, status: err.status || 400 });
    }
  }

  res.status(rejected.length > 0 ? 207 : 201).json({
    success: rejected.length === 0,
    data: accepted.map(({ hash, ...rest }) => rest),
    rejected,
  });
}

// validation shared by create/update: keep editing cheap in dev, strict later
function validateImageList(images) {
  if (!Array.isArray(images) || images.length < MIN_REQUIRED_IMAGES) {
    throw httpError(400, `Add at least ${MIN_REQUIRED_IMAGES} distinct photos of the product`);
  }
  if (images.length > 8) throw httpError(400, "A product can have at most 8 photos");
  if (images.some((url) => !/^\/api\/uploads\/[a-f\d]{24}$/i.test(String(url)))) {
    throw httpError(400, "Product photos must be uploaded files (upload them in the product form)");
  }
  if (new Set(images.map(String)).size !== images.length) {
    throw httpError(400, "Same photo was added twice — every product photo must be different");
  }
  return images;
}

module.exports = {
  uploadImages,
  validateImageList,
  productPhotoBucket,
  deleteUnreferencedProductPhotos,
  BUCKET_NAME,
  MIN_REQUIRED_IMAGES,
};
