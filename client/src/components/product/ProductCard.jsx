import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Heart, ShoppingCart } from "lucide-react";
import ProductImage from "./ProductImage";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function discountPct(original, sale) {
  if (!original || !sale || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  // brief "Added" confirmation on the card button, same idea as the product page
  const [added, setAdded] = useState(false);
  const addedTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  function handleAdd() {
    addItem(product._id, 1);
    setAdded(true);
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAdded(false), 1800);
  }
  const wishlisted = isWishlisted(product._id);
  const price = Number(product.price || 0);
  const salePrice = Number(product.salePrice || 0);
  const onSale = salePrice > 0 && salePrice < price;
  const outOfStock = Number(product.stock || 0) <= 0;
  const pct = onSale ? discountPct(price, salePrice) : 0;
  const currentPrice = Number(product.finalPrice || (onSale ? salePrice : price));
  const productPath = "/products/" + product.slug;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-sky-300">
      <Link
        to={productPath}
        aria-label={"View " + product.name}
        className="relative block aspect-square w-full overflow-hidden bg-[var(--color-surface)] p-1.5 sm:p-2"
      >          <ProductImage
          src={product.images?.[0]}
          alt={product.name}
          className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]"
          width="720"
          height="720"
        />

        {onSale && pct >= 10 ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {pct}% off
          </span>
        ) : null}

        {!onSale && !outOfStock && product.isNew ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
            NEW
          </span>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggle(product._id);
          }}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wishlisted}
          className={
            "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full transition " +
            (wishlisted
              ? "bg-rose-600 text-white"
              : "bg-white/90 text-slate-600 hover:bg-white hover:text-rose-600")
          }
        >
          <Heart className={"h-4 w-4 " + (wishlisted ? "fill-current" : "")} />
        </button>

        {outOfStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold text-[var(--color-muted)]">
            Out of stock
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {product.category?.name ? (
          <Link
            to={"/category/" + product.category.slug}
            className="w-fit max-w-full truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-primary-bright)] hover:underline sm:text-[11px]"
          >
            {product.category.name}
          </Link>
        ) : null}

        <Link
          to={productPath}
          className="line-clamp-2 min-h-9 text-xs font-semibold leading-5 text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)] sm:text-sm"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1">
          <span className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
            {formatPrice(currentPrice)}
          </span>
          {onSale ? (
            <span className="text-xs text-[var(--color-faint)] line-through">{formatPrice(price)}</span>
          ) : null}
          {onSale && pct > 0 ? (
            <span className="text-[10px] font-semibold text-[var(--color-success)]">Save {pct}%</span>
          ) : null}
        </div>

        {outOfStock ? (
          <Link
            to={productPath}
            className="mt-1.5 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] py-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white sm:text-sm"
          >
            View details
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-1.5 sm:gap-2">
            <Link
              to={productPath}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
            >
              View
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            {Object.values(product.options || {}).some((values) => Array.isArray(values) && values.length) ? (
              <Link to={productPath} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--color-primary)] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-bright)]">
                Choose
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                aria-label={added ? product.name + " added to cart" : "Add " + product.name + " to cart"}
                className={
                  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-white transition-all duration-300 " +
                  (added
                    ? "cartivo-added-pop bg-emerald-600"
                    : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-bright)]")
                }
              >
                {added ? <><Check className="h-3.5 w-3.5" aria-hidden="true" />Added</> : <><ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />Add</>}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
