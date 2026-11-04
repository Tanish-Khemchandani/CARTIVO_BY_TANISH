// Product-photo upload integration test.
// Run with the API running and ADMIN_EMAIL / ADMIN_PASSWORD set in server/.env.
const path = require("path");
const zlib = require("zlib");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { uploadImages, validateImageList, productPhotoBucket } = require("../controllers/imageUploadController");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {
  // Use the system resolver when public resolver configuration is unavailable.
}
const BASE = process.env.BASE || "http://localhost:5000/api";
let passed = 0;
let failed = 0;
let cookie = "";
const uploaded = [];
let createdId = "";

function check(label, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ok ${label}`);
  } else {
    failed++;
    console.error(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function pngChunk(type, data) {
  const name = Buffer.from(type);
  const crcInput = Buffer.concat([name, data]);
  let crc = 0xffffffff;
  for (const byte of crcInput) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  const header = Buffer.alloc(4);
  header.writeUInt32BE(data.length);
  const footer = Buffer.alloc(4);
  footer.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([header, name, data, footer]);
}

function makePng(seed, width = 800, height = 800) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = (seed + x * 3) & 255;
    row[2 + x * 3] = (seed * 3 + x) & 255;
    row[3 + x * 3] = (seed * 7 + x * 2) & 255;
  }
  const scanlines = Buffer.alloc(row.length * height);
  for (let y = 0; y < height; y++) {
    row[0] = 0;
    for (let i = 1; i < row.length; i++) row[i] = (row[i] + y * (i % 11)) & 255;
    row.copy(scanlines, y * row.length);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(scanlines, { level: 0 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  return { response, body: await response.json().catch(() => null) };
}

async function login() {
  const { response } = await jsonRequest(`${BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  const cookies = response.headers.getSetCookie?.() || [response.headers.get("set-cookie") || ""];
  cookie = cookies.find((value) => value.startsWith("cartivo_admin_session="))?.split(";")[0] || "";
  check("admin login", response.status === 200 && Boolean(cookie), `HTTP ${response.status}`);
  return response.status === 200 && Boolean(cookie);
}

async function upload(buffers) {
  const form = new FormData();
  for (const item of buffers) form.append("images", new Blob([item.bytes], { type: "image/png" }), item.name);
  return jsonRequest(`${BASE}/uploads`, { method: "POST", headers: { Cookie: cookie }, body: form });
}

async function createProduct(payload) {
  return jsonRequest(`${BASE}/products`, {
    method: "POST",
    headers: { "content-type": "application/json", Cookie: cookie },
    body: JSON.stringify(payload),
  });
}

async function runControllerChecks() {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGO_URI);
  const fixtures = [21, 87, 163].map((seed, index) => ({
    originalname: `controller-${index}.png`,
    buffer: makePng(seed, 400, 400),
    get size() { return this.buffer.length; },
  }));
  async function invoke(files) {
    const state = { status: 200, body: null };
    const response = {
      status(code) { state.status = code; return this; },
      json(body) { state.body = body; return this; },
    };
    await uploadImages({ files }, response);
    uploaded.push(...(state.body?.data || []).map((item) => item.url));
    return state;
  }

  const good = await invoke(fixtures);
  check("controller accepts three valid photos", good.status === 201 && good.body?.data?.length === 3,
    `HTTP ${good.status}`);
  const bucket = productPhotoBucket();
  const storedFiles = await Promise.all((good.body?.data || []).map((item) =>
    bucket.find({ _id: new mongoose.Types.ObjectId(path.basename(item.url)) }).hasNext()));
  check("uploaded photos are stored in MongoDB GridFS", storedFiles.every(Boolean), "a GridFS image record was not found");
  if (good.body?.data?.[0]) {
    const publicOrigin = BASE.replace(/\/api\/?$/, "");
    const served = await fetch(`${publicOrigin}${good.body.data[0].url}`);
    check("API serves uploaded photos at their public URLs", served.status === 200 && (served.headers.get("content-type") || "").startsWith("image/"),
      `HTTP ${served.status}`);
  }

  const duplicate = await invoke([fixtures[0], { ...fixtures[0], originalname: "duplicate.png" }]);
  check("controller rejects exact duplicate file bytes", duplicate.status === 207 && duplicate.body?.data?.length === 1 && duplicate.body?.rejected?.length === 1,
    `HTTP ${duplicate.status}`);

  const invalid = await invoke([{ originalname: "invalid.png", buffer: Buffer.alloc(16 * 1024, 0x41) }]);
  check("controller rejects non-image bytes", invalid.status === 207 && invalid.body?.rejected?.length === 1,
    `HTTP ${invalid.status}`);

  const tooSmall = await invoke([{ originalname: "tiny.png", buffer: makePng(5, 200, 200) }]);
  check("controller rejects images below minimum dimensions", tooSmall.status === 207 && /minimum/i.test(tooSmall.body?.rejected?.[0]?.message || ""),
    `HTTP ${tooSmall.status}`);

  function rejects(label, images) {
    let rejected = false;
    try { validateImageList(images); } catch { rejected = true; }
    check(label, rejected);
  }
  const sampleUrls = [
    "/api/uploads/000000000000000000000001",
    "/api/uploads/000000000000000000000002",
    "/api/uploads/000000000000000000000003",
  ];
  rejects("product validator requires three photos", sampleUrls.slice(0, 2));
  rejects("product validator rejects repeated photo URLs", [sampleUrls[0], sampleUrls[0], sampleUrls[1]]);
  rejects("product validator rejects external image URLs", ["https://example.invalid/a", sampleUrls[1], sampleUrls[2]]);
  try {
    validateImageList(sampleUrls);
    check("product validator accepts three unique uploaded photo URLs", true);
  } catch (error) {
    check("product validator accepts three unique uploaded photo URLs", false, error.message);
  }
}

async function main() {
  try {
    await runControllerChecks();
    const health = await fetch(BASE.replace(/\/api\/?$/, "/health"));
    check("API health", health.status === 200, `HTTP ${health.status}`);
    const unauthenticatedForm = new FormData();
    unauthenticatedForm.append("images", new Blob([makePng(39, 400, 400)], { type: "image/png" }), "unauthorized.png");
    const unauthenticated = await fetch(`${BASE}/uploads`, { method: "POST", body: unauthenticatedForm });
    check("upload route requires an admin session", unauthenticated.status === 401, `HTTP ${unauthenticated.status}`);
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log("  SKIP authenticated API checks — set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env");
      return;
    }
    if (!(await login())) return;

    const fixtures = [31, 93, 177].map((seed, index) => ({
      name: `cartivo-test-${index + 1}.png`,
      bytes: makePng(seed),
    }));
    const accepted = await upload(fixtures);
    check("three distinct photos upload", accepted.response.status === 201 && accepted.body?.data?.length === 3,
      `HTTP ${accepted.response.status}: ${JSON.stringify(accepted.body).slice(0, 180)}`);
    const urls = (accepted.body?.data || []).map((item) => item.url);
    uploaded.push(...urls);
    check("upload response has photo dimensions and metadata", accepted.body?.data?.every((item) => item.width === 800 && item.height === 800 && item.name),
      JSON.stringify(accepted.body?.data?.[0]));

    const duplicate = await upload([{ ...fixtures[0], name: "duplicate.png" }, { ...fixtures[0], name: "duplicate-copy.png" }]);
    check("same bytes rejected as duplicate", duplicate.response.status === 207 && duplicate.body?.data?.length === 1 && duplicate.body?.rejected?.length === 1,
      `HTTP ${duplicate.response.status}: ${JSON.stringify(duplicate.body).slice(0, 180)}`);
    uploaded.push(...(duplicate.body?.data || []).map((item) => item.url));

    const garbage = await upload([{ name: "fake.png", bytes: Buffer.alloc(16 * 1024, 0x41) }]);
    check("invalid image bytes rejected", garbage.response.status === 207 && garbage.body?.rejected?.length === 1,
      `HTTP ${garbage.response.status}`);

    const noAuthForm = new FormData();
    noAuthForm.append("images", new Blob([fixtures[0].bytes], { type: "image/png" }), "unauthorized.png");
    const noAuth = await fetch(`${BASE}/uploads`, { method: "POST", body: noAuthForm });
    check("uploads require an admin session", noAuth.status === 401, `HTTP ${noAuth.status}`);

    const categories = await jsonRequest(`${BASE}/admin/categories`, { headers: { Cookie: cookie } });
    const categoryId = categories.body?.data?.[0]?._id;
    check("admin category is available for product checks", Boolean(categoryId));
    if (categoryId && urls.length === 3) {
      const baseProduct = { name: `Upload smoke ${Date.now()}`, category: categoryId, price: 100, images: urls };
      const tooFew = await createProduct({ ...baseProduct, images: urls.slice(0, 2) });
      check("product requires three photos", tooFew.response.status === 400, `HTTP ${tooFew.response.status}`);
      const duplicateUrls = await createProduct({ ...baseProduct, images: [urls[0], urls[0], urls[1]] });
      check("product rejects repeated photo URLs", duplicateUrls.response.status === 400, `HTTP ${duplicateUrls.response.status}`);
      const external = await createProduct({ ...baseProduct, images: [urls[0], urls[1], "https://example.invalid/photo.jpg"] });
      check("product rejects external photo URLs", external.response.status === 400, `HTTP ${external.response.status}`);
      const created = await createProduct(baseProduct);
      check("product accepts three uploaded photos", created.response.status === 201, `HTTP ${created.response.status}: ${created.body?.message || ""}`);
      createdId = created.body?.data?._id || "";
      if (createdId) {
        const served = await fetch(`${BASE.replace(/\/api\/?$/, "")}${urls[0]}`);
        check("uploaded photo is publicly served", served.status === 200 && (served.headers.get("content-type") || "").startsWith("image/"), `HTTP ${served.status}`);
      }
    }
  } catch (error) {
    failed++;
    console.error(`  FAIL integration run — ${error.message}`);
  } finally {
    if (createdId && process.env.MONGO_URI) {
      try {
        if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGO_URI);
        await Product.deleteOne({ _id: createdId });
      } catch (error) {
        console.error(`  cleanup warning — ${error.message}`);
      } finally {
        await mongoose.disconnect().catch(() => {});
      }
    }
    if (mongoose.connection.readyState === 1) {
      const bucket = productPhotoBucket();
      for (const url of uploaded) {
        const id = path.basename(url);
        if (/^[a-f\d]{24}$/i.test(id)) await bucket.delete(new mongoose.Types.ObjectId(id)).catch(() => {});
      }
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exitCode = failed ? 1 : 0;
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

main();
