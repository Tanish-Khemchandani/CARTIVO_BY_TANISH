// Server-side pricing for cart quotes and order totals.
// Prices come only from the database - values sent by the browser are ignored.
const SHIPPING_FREE_ABOVE = 499;
const SHIPPING_FEE = 49;

function money(value) {
  return Math.max(0, Math.round(value * 100) / 100);
}

function productFinalPrice(product) {
  const price = Number(product.price || 0);
  const sale = Number(product.salePrice || 0);
  if (sale > 0 && sale < price) return sale;
  return price;
}

/**
 * Compute order totals from products fetched from the DB.
 * products: [{ _id, name, price, salePrice, category }]
 * items: [{ productId, quantity }]
 * gstRates: Map<productId, { rate, ruleName }> from loadGstRates (optional)
 *
 * Listed prices are GST-inclusive, so the tax is extracted from each line and
 * never added on top: subtotal already contains gstAmount, and
 * total = subtotal + shipping. The amount is kept for invoices and order
 * records.
 *
 * Returns { pricedItems, subtotal, gstAmount, gstBreakdown, shipping, total }.
 * Throws an Error with .status on a missing product.
 */
function priceCart(products, items, gstRates = new Map()) {
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const pricedItems = [];
  let subtotal = 0;
  let gstAmount = 0;
  const byRate = new Map();

  for (const item of items) {
    const product = byId.get(String(item.productId));
    if (!product) {
      const err = new Error("A product in your cart is no longer available");
      err.status = 400;
      throw err;
    }

    const availableOptions = product.options instanceof Map
      ? Object.fromEntries(product.options)
      : product.options || {};
    const optionEntries = Object.entries(availableOptions).filter(([, values]) => Array.isArray(values) && values.length);
    const selectedOptions = item.selectedOptions || {};
    if (optionEntries.some(([name]) => !selectedOptions[name] || !availableOptions[name].includes(selectedOptions[name]))) {
      const err = new Error(`Choose valid options for "${product.name}"`);
      err.status = 400;
      throw err;
    }
    if (Object.entries(selectedOptions).some(([name, value]) => !availableOptions[name]?.includes(value))) {
      const err = new Error(`One or more options for "${product.name}" are no longer available`);
      err.status = 400;
      throw err;
    }

    const unitPrice = productFinalPrice(product);
    const lineTotal = money(unitPrice * item.quantity);
    subtotal += lineTotal;
    pricedItems.push({
      product: product._id,
      name: product.name,
      price: unitPrice,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions || {},
    });

    const resolved = gstRates.get(String(product._id));
    const rate = resolved ? Number(resolved.rate) : 0;
    if (rate > 0) {
      // tax portion of an inclusive price: gross - gross / (1 + rate/100)
      const lineTax = money(lineTotal - lineTotal / (1 + rate / 100));
      gstAmount += lineTax;
      byRate.set(rate, money((byRate.get(rate) || 0) + lineTax));
    }
  }

  subtotal = money(subtotal);
  gstAmount = money(gstAmount);
  const shipping = subtotal === 0 || subtotal >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_FEE;
  const total = money(subtotal + shipping);

  const gstBreakdown = [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, amount]) => ({ rate, amount }));

  return { pricedItems, subtotal, gstAmount, gstBreakdown, shipping, total };
}

module.exports = { priceCart, productFinalPrice, SHIPPING_FREE_ABOVE, SHIPPING_FEE };
