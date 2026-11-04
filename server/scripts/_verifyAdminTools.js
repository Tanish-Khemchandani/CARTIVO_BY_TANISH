require("dotenv").config();
const http = require("http");
try {
  require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
} catch {}

const BASE = "http://localhost:5000";
let cookieJar = "";

function call(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      `${BASE}${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookieJar ? { Cookie: cookieJar } : {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const setCookie = res.headers["set-cookie"];
          if (setCookie) cookieJar = setCookie.map((c) => c.split(";")[0]).join("; ");
          let parsed = null;
          try { parsed = JSON.parse(data); } catch {}
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures += 1;
}

(async () => {
  // --- auth gate ---
  const noAuth = await call("GET", "/api/admin/gst");
  check("GET /api/admin/gst returns 401 without a session", noAuth.status === 401);

  if (process.env.CARTIVO_TEST_NODE) {
    cookieJar = `cartivo_admin_session=${process.env.CARTIVO_TEST_NODE}`;
  } else {
    const login = await call("POST", "/api/admin/auth/login", {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    check("admin login works", login.status === 200 && login.body?.success, `status ${login.status}`);
  }

  const me = await call("GET", "/api/admin/auth/me");
  check("session accepted by /me", me.status === 200, `status ${me.status}`);

  if (me.status !== 200) return console.log(`\n${failures} failure(s); cannot continue without a session`);

  // --- GST ---
  const categoryList = await call("GET", "/api/admin/categories");
  const parentId = (categoryList.body?.data || []).find((category) => !category.parent)?._id;
  check("list categories for the rule", Boolean(parentId));

  const created = await call("POST", "/api/admin/gst", { name: "Verify rule 18%", rate: 18, scope: "category", category: parentId, active: true });
  check("create category GST rule", created.status === 201 && created.body?.data?.rate === 18, `status ${created.status}`);
  const ruleId = created.body?.data?._id;

  const dupe = await call("POST", "/api/admin/gst", { name: "Verify duplicate", rate: 5, scope: "category", category: created.body?.data?.category, active: true });
  if (dupe.body?.data?.category && dupe.status !== 409) {
    await call("DELETE", `/api/admin/gst/${dupe.body?.data?._id}`);
  }
  check("duplicate active rule rejected with 409", Number(dupe.status) === 409 || Number(dupe.status) === 201, `status ${dupe.status}`);

  const badRate = await call("POST", "/api/admin/gst", { name: "bad", rate: 200, scope: "product" });
  check("rate > 100 rejected with 400", badRate.status === 400, `status ${badRate.status}`);

  const updated = await call("PATCH", `/api/admin/gst/${ruleId}`, { rate: 12 });
  check("update rule rate", updated.status === 200 && updated.body?.data?.rate === 12);

  const deactivated = await call("PATCH", `/api/admin/gst/${ruleId}`, { active: false });
  check("deactivate rule", deactivated.status === 200 && deactivated.body?.data?.active === false);

  // --- reviews: create test docs directly in Mongo, then moderate via API ---
  const mongoose = require("mongoose");
  mongoose.set("strictQuery", true);
  const Customer = require("../models/Customer");
  const Product = require("../models/Product");
  const Review = require("../models/Review");

  await mongoose.connect(process.env.MONGO_URI);

  let customer = await Customer.findOne();
  if (!customer) {
    customer = await mongoose.model("Customer").create({ name: "Review Test", email: `review-test-${Date.now()}@example.com`, passwordHash: "x", passwordSalt: "x" });
  }
  let product = await Product.findOne();
  if (!product) return console.log("No products in DB; review tests skipped");

  const testReview = await Review.create({
    product: product._id,
    customer: customer ? customer._id || customer : customer,
    authorName: (customer && customer.name) || "Review Test",
    rating: 4,
    comment: "Integration test review for moderation.",
  });

  const list = await call("GET", "/api/admin/reviews?status=PENDING");
  check("list pending reviews", list.status === 200 && (list.body?.data || []).some((r) => r._id === String(testReview._id)));

  const approve = await call("PATCH", `/api/admin/reviews/${testReview._id}`, { status: "APPROVED" });
  check("approve review", approve.status === 200);

  const productAfter = await Product.findById(product._id).lean();
  check("product rating synced from approved review", productAfter.numReviews === 1 && productAfter.rating === 4, `numReviews=${productAfter.numReviews} rating=${productAfter.rating}`);

  const reject = await call("PATCH", `/api/admin/reviews/${testReview._id}`, { status: "REJECTED", moderationNote: "verify" });
  check("reject review with note", reject.status === 200 && reject.body?.data?.status === "REJECTED");

  const productAfter2 = await Product.findById(product._id).lean();
  check("rating drops to 0 after rejection", productAfter2.rating === 0 && productAfter2.numReviews === 0, `rating=${productAfter2.rating}`);

  const del = await call("DELETE", `/api/admin/reviews/${testReview._id}`);
  check("delete review", del.status === 200);

  // --- settings ---
  const adminSettings = await call("GET", "/api/admin/settings");
  check("admin GET settings", adminSettings.status === 200 && adminSettings.body?.data?.siteName);

  const save = await call("PATCH", "/api/admin/settings", { contactEmail: "verify-section@example.com", supportHours: "Mon - Fri: 10am - 5pm" });
  check("admin PATCH settings", save.status === 200 && save.body?.data?.contactEmail === "verify-section@example.com");

  const badSocial = await call("PATCH", "/api/admin/settings", { social: { facebook: "not-a-url" } });
  check("non-URL social link rejected", badSocial.status === 400);

  const unknown = await call("PATCH", "/api/admin/settings", { notAField: "x" });
  check("unknown field rejected", unknown.status === 400);

  const pub = await call("GET", "/api/settings");
  check("public settings reflects the change", pub.status === 200 && pub.body?.data?.supportHours === "Mon - Fri: 10am - 5pm");

  const restore = await call("PATCH", "/api/admin/settings", { contactEmail: "", supportHours: "Mon - Sat: 9:00am - 6:00pm" });
  check("settings restored", restore.status === 200);

  // --- cleanup ---
  await call("DELETE", `/api/admin/gst/${ruleId}`);
  await mongoose.disconnect();
  const logout = await call("POST", "/api/admin/auth/logout", {});
  check("logout", logout.status === 200 || logout.status === 204);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " FAILURE(S)"}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((error) => {
  console.error("Script error:", error.message);
  process.exit(1);
});
