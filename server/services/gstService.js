// Resolves which GST rate applies to each product in a cart.
//
// Catalog prices are GST-inclusive, so the rate never changes what a shopper
// pays: pricing extracts the tax portion for invoices and order records.
//
// Precedence, newest rule first:
//   1. a rule scoped to the product
//   2. a rule scoped to the product's category
//   3. a rule scoped to an ancestor category (Men -> Fashion)
// Only active rules whose effectiveFrom has passed are considered, and the
// admin controller refuses a second active immediate rule on the same target,
// so this lookup never has to guess between two rates.
const GstRule = require("../models/GstRule");
const Category = require("../models/Category");

const MAX_CATEGORY_DEPTH = 4;

function idOf(value) {
  if (!value) return null;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

async function loadGstRates(products) {
  if (!Array.isArray(products) || products.length === 0) return new Map();

  const now = new Date();
  const rules = await GstRule.find({
    active: true,
    $or: [{ effectiveFrom: null }, { effectiveFrom: { $lte: now } }],
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  if (rules.length === 0) return new Map();

  const productRules = new Map();
  const categoryRules = new Map();
  for (const rule of rules) {
    if (rule.scope === "product" && rule.product) {
      const key = String(rule.product);
      if (!productRules.has(key)) productRules.set(key, rule);
    } else if (rule.scope === "category" && rule.category) {
      const key = String(rule.category);
      if (!categoryRules.has(key)) categoryRules.set(key, rule);
    }
  }

  // Parent links are needed so a rule on "Fashion" also covers "Men".
  const categories = await Category.find({}).select("parent").lean();
  const parentOf = new Map(
    categories.map((category) => [String(category._id), category.parent ? String(category.parent) : null])
  );

  const rates = new Map();
  for (const product of products) {
    const productId = String(product._id);
    const direct = productRules.get(productId);
    if (direct) {
      rates.set(productId, { rate: direct.rate, ruleName: direct.name });
      continue;
    }

    let categoryId = idOf(product.category);
    for (let depth = 0; categoryId && depth < MAX_CATEGORY_DEPTH; depth += 1) {
      const hit = categoryRules.get(categoryId);
      if (hit) {
        rates.set(productId, { rate: hit.rate, ruleName: hit.name });
        break;
      }
      categoryId = parentOf.get(categoryId) || null;
    }
  }

  return rates;
}

module.exports = { loadGstRates };
