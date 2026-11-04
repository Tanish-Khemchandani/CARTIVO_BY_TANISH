import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { quoteCart, placeOrder } from "../api/checkout";
import { getProducts } from "../api/products";
import ProductImage from "../components/product/ProductImage";

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function Checkout() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState({});
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  const sellable = useMemo(
    () => products && items.filter((item) => products[item.productId]?.stock > 0).length > 0,
    [items, products]
  );

  useEffect(() => {
    if (items.length === 0) return;
    getProducts({ limit: "100", sort: "newest" })
      .then((res) => {
        const map = {};
        for (const p of res.data || []) map[p._id] = p;
        setProducts(map);
      })
      .catch(() => setProducts({}));
  }, [items]);

  // totals come from the server quote, never client math
  useEffect(() => {
    if (items.length === 0) return;
    let active = true;
    setQuoteError("");
    quoteCart(items)
      .then((res) => {
        if (active) setQuote(res.data);
      })
      .catch((err) => {
        if (active) {
          setQuote(null);
          setQuoteError(err.message || "Could not price your cart.");
        }
      });
    return () => {
      active = false;
    };
  }, [items]);

  function updateField(field) {
    return (event) => setAddress((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPlaceError("");
    setPlacing(true);
    try {
      const stale = items.filter(
        (item) => !products[item.productId] || products[item.productId].stock < item.quantity
      );
      if (stale.length > 0) {
        setPlaceError("Some items exceed available stock. Adjust the cart and try again.");
        setPlacing(false);
        return;
      }

      const res = await placeOrder({ items, shippingAddress: address });
      setPlacedOrder(res.data);
      clearCart();
    } catch (err) {
      setPlaceError(err.message || "Could not place your order.");
    } finally {
      setPlacing(false);
    }
  }

  // ── confirmation screen ───────────────────────────────────────────────
  if (placedOrder) {
    return (
      <div className="mx-auto max-w-xl px-3 py-12 text-center sm:px-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h1 className="mt-6 font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          Order placed!
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Your order <span className="font-semibold text-[var(--color-ink)]">{placedOrder.orderNo}</span> is
          confirmed for Cash on Delivery.
        </p>
        <dl className="mt-6 space-y-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Items</dt>
            <dd className="font-medium text-[var(--color-ink)]">{placedOrder.items.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Total to pay on delivery</dt>
            <dd className="font-[var(--font-display)] font-bold text-[var(--color-ink)]">
              {formatPrice(placedOrder.total)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Deliver to</dt>
            <dd className="max-w-[60%] text-right font-medium text-[var(--color-ink)]">
              {placedOrder.shippingAddress?.fullName}, {placedOrder.shippingAddress?.city}{" "}
              {placedOrder.shippingAddress?.pincode}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Keep this order number — you can{" "}
          <Link
            to="/track-order"
            className="font-semibold text-[var(--color-primary-bright)] hover:underline"
          >
            track your order
          </Link>{" "}
          with it and the phone number you used.
        </p>
        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-bright)]"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  // ── empty cart guard ─────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-8">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Nothing to check out</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Your cart is empty.</p>
        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-bright)]"
        >
          Browse products
        </Link>
      </div>
    );
  }

  // ── checkout form ────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-5">
      <nav aria-label="Checkout steps" className="mb-4 flex items-center gap-2 text-xs text-[var(--color-muted)]">
        <Link to="/cart" className="font-semibold text-[var(--color-primary-bright)] hover:underline">Cart</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="step" className="font-semibold text-[var(--color-ink)]">Checkout</span>
        <span aria-hidden="true">›</span>
        <span>Confirmation</span>
      </nav>

      {quoteError && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{quoteError}</p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="address-heading" className="min-w-0">
          <h1 id="address-heading" className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)] sm:text-xl">
            Delivery address
          </h1>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3.5 sm:grid-cols-2" noValidate>
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                Full name
              </label>                <input
                  id="fullName"
                  required
                  maxLength={100}
                  value={address.fullName}
                  onChange={updateField("fullName")}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-bright)]"
                />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                Phone
              </label>                <input
                  id="phone"
                  type="tel"
                  required
                  value={address.phone}
                  onChange={updateField("phone")}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-bright)]"
                />
            </div>

            <div>
              <label htmlFor="pincode" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                Pincode
              </label>                <input
                  id="pincode"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={address.pincode}
                  onChange={updateField("pincode")}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-bright)]"
                />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="line1" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                Address line 1
              </label>
              <input
                id="line1"
                required
                maxLength={200}
                value={address.line1}
                onChange={updateField("line1")}
                placeholder="House no, building, street"
                className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-bright)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="line2" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                Address line 2 <span className="font-normal normal-case text-[var(--color-faint)]">(optional)</span>
              </label>
              <input
                id="line2"
                maxLength={200}
                value={address.line2}
                onChange={updateField("line2")}
                placeholder="Area, landmark"
                className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-bright)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="city" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                City
              </label>
              <input
                id="city"
                required
                maxLength={60}
                value={address.city}
                onChange={updateField("city")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-bright)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="state" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                State
              </label>
              <input
                id="state"
                required
                maxLength={60}
                value={address.state}
                onChange={updateField("state")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-bright)]"
              />
            </div>

            <div className="sm:col-span-2 mt-1">
              <button
                type="submit"
                disabled={placing || !quote || !sellable}
                className="w-full rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placing ? "Placing order..." : quote ? `Place order · ${formatPrice(quote.total)}` : "Loading totals..."}
              </button>
              {placeError && <p role="alert" className="mt-3 text-sm text-rose-600">{placeError}</p>}
              <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
                Pay {quote ? formatPrice(quote.total) : "the total"} in cash when your order arrives.
              </p>
            </div>
          </form>
        </section>

        <aside aria-label="Order summary" className="h-fit min-w-0 rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => {
              const product = products[item.productId];
              const lineKey = JSON.stringify([item.productId, item.selectedOptions || {}]);
              return (
                <li key={lineKey} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--color-surface)] p-1">
                    {product ? (
                      <ProductImage
                        src={product.images?.[0]}
                        alt={product.name}
                        className="h-full w-full object-contain"
                        width="128"
                        height="128"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--color-ink)]">
                      {product?.name || "Loading..."}
                    </p>
                    {Object.entries(item.selectedOptions || {}).map(([name, value]) => <p key={name} className="text-xs capitalize text-[var(--color-muted)]">{name}: {value}</p>)}
                    <p className="text-xs text-[var(--color-muted)]">Qty {item.quantity}</p>
                  </div>
                  {product ? (
                    <span className="text-xs font-semibold text-[var(--color-ink)]">
                      {formatPrice((product.finalPrice || product.price) * item.quantity)}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {quote ? (
            <dl className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)]">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-[var(--color-ink)]">{formatPrice(quote.subtotal)}</dd>
              </div>
              {quote.gstAmount > 0 && (
                <div className="flex justify-between">
                  <dt>
                    GST included
                    {quote.gstBreakdown?.length === 1 ? ` (${quote.gstBreakdown[0].rate}%)` : ""}
                  </dt>
                  <dd className="font-medium text-[var(--color-ink)]">{formatPrice(quote.gstAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd className="font-medium text-[var(--color-ink)]">
                  {quote.shipping === 0 ? "Free" : formatPrice(quote.shipping)}
                </dd>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--color-ink)]">
                <dt>Total</dt>
                <dd className="font-[var(--font-display)]">{formatPrice(quote.total)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)]">
              Calculating totals...
            </p>
          )}
          <p className="mt-3 text-xs text-[var(--color-muted)]">Cash on Delivery</p>
        </aside>
      </div>
    </div>
  );
}
