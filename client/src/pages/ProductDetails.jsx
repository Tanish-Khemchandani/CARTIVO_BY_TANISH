import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Star,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getProductBySlug, getProductReviews, getProducts, submitProductReview } from "../api/products";
import ProductImage from "../components/product/ProductImage";
import ProductCard from "../components/product/ProductCard";

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getProductPrice(product) {
  const finalPrice = Number(product.finalPrice);
  if (Number.isFinite(finalPrice) && finalPrice > 0) return finalPrice;
  if (product.salePrice > 0 && product.salePrice < product.price) return product.salePrice;
  return Number(product.price || 0);
}

function LoadingDetails() {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:px-12">
      <div className="aspect-square animate-pulse rounded-3xl bg-slate-100" />
      <div className="space-y-5 py-5">
        <div className="h-4 w-1/4 animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-8 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function ProductDetails() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { user, openAuth } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  function handleAddToCart() {
    if (!product || stock <= 0) return;
    addItem(product._id, quantity, selectedOptions);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();
    setReviewMessage("");
    setReviewError("");
    if (!user) {
      openAuth();
      return;
    }
    if (!reviewRating) {
      setReviewError("Choose a star rating before submitting.");
      return;
    }
    setSubmittingReview(true);
    try {
      const response = await submitProductReview(product._id, { rating: reviewRating, comment: reviewComment });
      setReviewMessage(response.message || "Thanks — your review is awaiting moderation.");
      setReviewComment("");
      setReviewRating(0);
    } catch (requestError) {
      setReviewError(requestError.message || "Your review could not be submitted.");
    } finally {
      setSubmittingReview(false);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProduct(null);
    setError("");
    setSelectedImage(0);
    setSelectedOptions({});
    setQuantity(1);
    setAdded(false);
    setReviews([]);
    setReviewRating(0);
    setReviewComment("");
    setReviewMessage("");
    setReviewError("");

    getProductBySlug(slug)
      .then((response) => {
        if (active) setProduct(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Product details could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!product?._id) return undefined;
    let active = true;
    setReviewsLoading(true);
    getProductReviews(product._id, { limit: "20" })
      .then((response) => {
        if (active) setReviews(response.data || []);
      })
      .catch(() => {
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => { active = false; };
  }, [product?._id]);

  const category = useMemo(
    () => (typeof product?.category === "object" ? product.category : null),
    [product]
  );
  const images = product?.images?.length ? product.images : ["/assets/brand/product-placeholder.svg"];
  const currentPrice = product ? getProductPrice(product) : 0;
  const onSale = Boolean(product && product.salePrice > 0 && product.salePrice < product.price);
  const discount = onSale
    ? Math.round(((product.price - currentPrice) / product.price) * 100)
    : 0;
  const stock = Number(product?.stock || 0);
  const productOptions = product?.options && typeof product.options === "object"
    ? Object.entries(product.options).map(([name, values]) => [name, Array.isArray(values) ? values : []]).filter(([, values]) => values.length)
    : [];

  useEffect(() => {
    if (!product) return;
    document.title = product.name + " | CARTIVO";
    if (!product.category?._id) {
      setRelatedProducts([]);
      return;
    }

    let active = true;
    getProducts({ category: product.category._id, limit: "5", sort: "newest" })
      .then((response) => {
        if (!active) return;
        setRelatedProducts(
          (response.data || [])
            .filter((item) => item.slug !== product.slug)
            .slice(0, 4)
        );
      })
      .catch(() => {
        if (active) setRelatedProducts([]);
      });

    return () => {
      active = false;
    };
  }, [product]);

  if (loading) return <LoadingDetails />;

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-8">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          Product unavailable
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          {error || "We could not find that product in the current catalog."}
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-bright)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Browse products
        </Link>
      </div>
    );
  }

  const descriptionParagraphs = product.description
    ? product.description.split(/\n{2,}/).filter(Boolean)
    : [];

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)] sm:text-sm">
        <Link to="/" className="hover:text-[var(--color-primary-bright)]">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link to="/products" className="hover:text-[var(--color-primary-bright)]">Products</Link>
        {category ? (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link to={"/category/" + category.slug} className="hover:text-[var(--color-primary-bright)]">
              {category.name}
            </Link>
          </>
        ) : null}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span aria-current="page" className="max-w-[45vw] truncate font-semibold text-[var(--color-ink)]">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)] lg:gap-10">
        <section className="min-w-0 lg:sticky lg:top-20 lg:self-start" aria-label="Product images">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white p-3 sm:p-6 lg:aspect-auto lg:h-[min(72vh,620px)] lg:min-h-[380px]">
            <ProductImage
              src={images[selectedImage]}
              alt={product.name}
              loading="eager"
              fetchpriority="high"
              width="1024"
              height="1024"
              className="h-full w-full object-contain"
            />
            {discount >= 10 ? (
              <span className="absolute left-5 top-5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                Save {discount}%
              </span>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div
              className="hfx-nav-sliding-pill mt-3 w-fit max-w-full overflow-x-auto bg-white/60"
              aria-label="Choose product image"
              data-count={Math.min(images.length, 8)}
              style={{"--hfx-active": selectedImage}}
            >
              {images.map((image, index) => (
                <button
                  key={image + index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={"Show product image " + (index + 1)}
                  aria-pressed={selectedImage === index}
                  className="flex h-14 w-14 items-center justify-center overflow-hidden p-1.5 sm:h-16 sm:w-16"
                >
                  <ProductImage
                    src={image}
                    alt=""
                    width="1024"
                    height="1024"
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="min-w-0">
          {category ? (
            <Link
              to={"/category/" + category.slug}
              className="text-xs font-bold uppercase tracking-[0.17em] text-[var(--color-primary-bright)] hover:underline"
            >
              {category.name}
            </Link>
          ) : null}
          <h1 className="mt-2 font-[var(--font-display)] text-xl font-extrabold leading-tight tracking-tight text-[var(--color-ink)] sm:text-2xl lg:text-3xl">
            {product.name}
          </h1>
          {product.brand ? (
            <p className="mt-1.5 text-xs text-[var(--color-muted)] sm:text-sm">
              Brand <span className="font-semibold text-[var(--color-ink)]">{product.brand}</span>
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
              {formatPrice(currentPrice)}
            </span>
            {onSale ? (
              <>
                <span className="text-base text-[var(--color-faint)] line-through">{formatPrice(product.price)}</span>
                <span className="text-sm font-semibold text-[var(--color-success)]">{discount}% off</span>
              </>
            ) : null}
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <span className={
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold " +
              (stock > 0
                ? "bg-emerald-50 text-emerald-800"
                : "bg-rose-50 text-rose-700")
            }>
              <span className={"h-2 w-2 rounded-full " + (stock > 0 ? "bg-emerald-600" : "bg-rose-600")} aria-hidden="true" />
              {stock > 0 ? "In stock" : "Out of stock"}
            </span>
            {stock > 0 && stock <= 5 ? (
              <span className="text-xs text-[var(--color-muted)]">{stock} available</span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl bg-[var(--color-surface)] p-3.5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary-bright)]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Availability shown clearly</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">Stock status is updated from the current catalog.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary-bright)]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Product details at a glance</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">Pricing and product information come from CARTIVO.</p>
              </div>
            </div>
          </div>

          {product.sku ? (
            <p className="mt-4 text-xs text-[var(--color-faint)]">SKU: {product.sku}</p>
          ) : null}

          {productOptions.length > 0 ? (
            <fieldset className="mt-5 space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <legend className="px-1 text-sm font-semibold text-[var(--color-ink)]">Choose your options</legend>
              {productOptions.map(([name, values]) => (
                <div key={name}>
                  <label htmlFor={`product-option-${name}`} className="mb-1.5 block text-xs font-semibold capitalize text-[var(--color-muted)]">{name}{selectedOptions[name] ? ` · ${selectedOptions[name]}` : ""}</label>
                  <select id={`product-option-${name}`} value={selectedOptions[name] || ""} onChange={(event) => setSelectedOptions((current) => ({ ...current, [name]: event.target.value }))} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary-bright)]">
                    <option value="">Select {name.toLowerCase()}</option>
                    {values.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </div>
              ))}
            </fieldset>
          ) : null}

          {stock > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-[var(--color-border)]">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)]"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                  className="p-2.5 text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)]"
                  disabled={quantity >= stock}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={productOptions.some(([name]) => !selectedOptions[name])}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                {added ? "Added ✓" : "Add to cart"}
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
            >
              Explore more products <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {category ? (
              <Link
                to={"/category/" + category.slug}
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
              >
                More in {category.name}
              </Link>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-8 border-t border-[var(--color-border)] pt-6" aria-labelledby="product-description-title">
        <h2 id="product-description-title" className="font-[var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
          About this product
        </h2>
        {descriptionParagraphs.length ? (
          <div className="mt-4 max-w-4xl space-y-3 text-sm leading-7 text-[var(--color-muted)]">
            {descriptionParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        ) : (
          <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--color-muted)]">
            More product information will be added to this listing soon.
          </p>
        )}
        <dl className="mt-7 grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          {product.brand ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Brand</dt>
              <dd className="mt-1 text-sm font-medium text-[var(--color-ink)]">{product.brand}</dd>
            </div>
          ) : null}
          {category ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Category</dt>
              <dd className="mt-1 text-sm font-medium text-[var(--color-ink)]">{category.name}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Availability</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink)]">
              <Check className="h-4 w-4 text-[var(--color-success)]" aria-hidden="true" />
              {stock > 0 ? "Available" : "Currently unavailable"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-8 border-t border-[var(--color-border)] pt-6" aria-labelledby="reviews-title">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary-bright)]">Customer feedback</p>
                <h2 id="reviews-title" className="mt-1 font-[var(--font-display)] text-xl font-bold text-[var(--color-ink)]">Reviews</h2>
              </div>
              {Number(product.numReviews || 0) > 0 ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-ink)]">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {Number(product.rating).toFixed(1)} · {product.numReviews} review{Number(product.numReviews) === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            {reviewsLoading ? <p className="mt-5 text-sm text-[var(--color-muted)]">Loading reviews…</p> : null}
            {!reviewsLoading && reviews.length === 0 ? (
              <p className="mt-5 text-sm text-[var(--color-muted)]">No approved reviews yet. Be the first to share your experience.</p>
            ) : null}
            <div className="mt-5 space-y-4">
              {reviews.map((review) => (
                <article key={review._id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{review.authorName}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700" aria-label={`${review.rating} out of 5`}>
                      {review.rating} <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">{review.comment}</p>
                  <p className="mt-3 text-xs text-[var(--color-faint)]">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </article>
              ))}
            </div>
          </div>

          <form noValidate onSubmit={handleReviewSubmit} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h3 className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Write a review</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">Reviews are published after moderation. One review per signed-in customer.</p>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-[var(--color-ink)]">Your rating</legend>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" role="radio" aria-checked={reviewRating === star} aria-label={`${star} star${star === 1 ? "" : "s"}`} onClick={() => setReviewRating(star)} className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-bright)]">
                    <Star className={`h-6 w-6 ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </fieldset>
            <label htmlFor="review-comment" className="mt-4 block text-sm font-semibold text-[var(--color-ink)]">Your review</label>
            <textarea id="review-comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={2000} rows={5} placeholder="What did you like or dislike?" className="mt-2 w-full resize-y rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary-bright)]" required />
            {reviewError ? <p className="mt-3 text-sm text-rose-700" role="alert">{reviewError}</p> : null}
            {reviewMessage ? <p className="mt-3 text-sm text-emerald-700" role="status">{reviewMessage}</p> : null}
            <button type="submit" disabled={submittingReview} className="mt-4 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60">
              {submittingReview ? "Submitting…" : user ? "Submit review" : "Sign in to review"}
            </button>
          </form>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="mt-8 border-t border-[var(--color-border)] pt-6" aria-labelledby="related-products-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary-bright)]">Keep exploring</p>
                <h2 id="related-products-title" className="mt-1 font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)] sm:text-xl">
                More from this category
              </h2>
            </div>
            {category ? (
              <Link to={"/category/" + category.slug} className="hidden items-center gap-1 text-sm font-semibold text-[var(--color-primary-bright)] sm:inline-flex">
                View category <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {relatedProducts.map((item) => <ProductCard key={item._id || item.slug} product={item} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
