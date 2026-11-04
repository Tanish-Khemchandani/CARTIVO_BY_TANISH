import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { quoteCart } from "../api/checkout";
import ProductImage from "../components/product/ProductImage";
import { getProducts } from "../api/products";

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function Cart() {
  const { items, setQuantity, removeItem } = useCart();
  const [products, setProducts] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setQuote(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError("");

    getProducts({ limit: "100", sort: "newest" })
      .then((res) => {
        if (!active) return;
        const wanted = new Set(items.map((item) => item.productId));
        setProducts((res.data || []).filter((p) => wanted.has(p._id)));
      })
      .catch(() => {
        if (active) setLoadError("Could not load your cart. Try refreshing.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [items]);

  // totals always come from the server quote, never client math
  useEffect(() => {
    if (items.length === 0) return;
    let active = true;
    quoteCart(items)
      .then((res) => {
        if (active) setQuote(res.data);
      })
      .catch(() => {
        if (active) setQuote(null);
      });
    return () => {
      active = false;
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)]">
          <ShoppingBag className="h-8 w-8 text-[var(--color-muted)]" />
        </div>
        <h1 className="mt-6 font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Your cart is empty</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Browse the catalog and add something you like.</p>
        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const staleProducts = items.filter((item) => !products.some((p) => p._id === item.productId));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="font-[var(--font-display)] text-xl font-bold text-[var(--color-ink)] sm:text-2xl">Your cart</h1>

      {loadError && <p className="mt-4 text-sm text-rose-600">{loadError}</p>}
      {staleProducts.length > 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Some items were removed from the catalog and will be dropped at checkout.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Cart items" className="flex flex-col gap-4">
          {items.map((item) => {
            const product = products.find((p) => p._id === item.productId);
            if (!product) return null;
            const stock = Number(product.stock || 0);
            const maxQty = Math.max(1, Math.min(99, stock));
            const outOfStock = stock <= 0;
            const price = Number(product.finalPrice || product.price);

            const lineKey = JSON.stringify([item.productId, item.selectedOptions || {}]);
            return (
              <article key={lineKey} className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <Link
                  to={"/products/" + product.slug}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface)] p-2"
                  aria-label={"View " + product.name}
                >
                  <ProductImage
                    src={product.images?.[0]}
                    alt={product.name}
                    className="h-full w-full object-contain"
                    width="256"
                    height="256"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    to={"/products/" + product.slug}
                    className="line-clamp-2 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary-bright)]"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{formatPrice(price)}</p>
                  {Object.entries(item.selectedOptions || {}).map(([name, value]) => <p key={name} className="mt-0.5 text-xs capitalize text-[var(--color-muted)]">{name}: {value}</p>)}

                  {outOfStock ? (
                    <p className="mt-2 text-xs font-semibold text-rose-600">Out of stock — remove it to check out</p>
                  ) : (
                    <div className="mt-auto flex items-center gap-3 pt-3">
                      <div className="inline-flex items-center rounded-full border border-[var(--color-border)]">
                        <button
                          type="button"
                          aria-label={"Decrease quantity of " + product.name}
                          onClick={() => setQuantity(item, item.quantity - 1)}
                          className="p-2 text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)] disabled:opacity-40"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={"Increase quantity of " + product.name}
                          onClick={() => setQuantity(item, item.quantity + 1)}
                          className="p-2 text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)] disabled:opacity-40"
                          disabled={item.quantity >= maxQty}
                          title={stock <= item.quantity ? "Only " + stock + " in stock" : undefined}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        aria-label={"Remove " + product.name + " from cart"}
                        className="rounded-full p-2 text-[var(--color-muted)] transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <aside aria-label="Order summary" className="h-fit rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Order summary</h2>
          {loading || !quote ? (
            <p className="mt-4 text-sm text-[var(--color-muted)]">Calculating totals...</p>
          ) : (
            <dl className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
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
              <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base">
                <dt className="font-bold text-[var(--color-ink)]">Total</dt>
                <dd className="font-[var(--font-display)] font-bold text-[var(--color-ink)]">
                  {formatPrice(quote.total)}
                </dd>
              </div>
            </dl>
          )}
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Free shipping over {formatPrice(499)} · Cash on Delivery available
          </p>
          <Link
            to="/checkout"
            className="mt-5 flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
          >
            Proceed to checkout
          </Link>
          <Link
            to="/products"
            className="mt-3 flex items-center justify-center text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-primary-bright)]"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
