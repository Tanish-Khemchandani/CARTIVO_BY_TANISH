import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { getCategories } from "../../api/categories";
import { getProducts } from "../../api/products";
import { useTheme } from "../../context/ThemeContext";
import ProductCard from "../product/ProductCard";

const PAGE_SIZE = 12;
const FALLBACK_CATEGORY_IMAGE = "/assets/generated/hero/hero-home.jpg";

function getId(value) {
  return typeof value === "object" && value ? value._id : value;
}

function getDescendantIds(categories, rootId) {
  const ids = [String(rootId)];
  const pending = [String(rootId)];

  while (pending.length) {
    const parentId = pending.shift();
    for (const category of categories) {
      if (String(getId(category.parent) || "") === parentId) {
        const childId = String(category._id);
        if (!ids.includes(childId)) {
          ids.push(childId);
          pending.push(childId);
        }
      }
    }
  }
  return ids;
}

function getRootCategory(category, categories) {
  let current = category;
  while (current?.parent) {
    const parentId = String(getId(current.parent));
    const parent = categories.find((item) => String(item._id) === parentId);
    if (!parent) break;
    current = parent;
  }
  return current;
}

function CategoryImage({ slug, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = failed
    ? FALLBACK_CATEGORY_IMAGE
    : "/assets/campaign/category-cards/" + slug + ".webp";
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      width="1024"
      height="1024"
      onError={() => setFailed(true)}
    />
  );
}

function CatalogHero({ title, description, category }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const categorySlug = category?.root?.slug || category?.slug;
  const image = categorySlug
    ? `/assets/campaign/categories/${categorySlug}.webp`
    : dark ? "/assets/campaign/hero-dark.png" : "/assets/campaign/hero-light.png";
  return (
    <section className={`cartivo-catalog-hero relative isolate mb-8 overflow-hidden rounded-3xl ${dark ? "cartivo-hero-dark" : "cartivo-hero-light"}`}>
      {/* full 3:1 artwork in the flow on narrow screens; same-ratio panel behind
          the copy from xl, so the picture is never clipped */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="cartivo-catalog-art block h-auto w-full object-contain xl:absolute xl:inset-0 xl:-z-20 xl:h-full xl:object-cover"
        width="2172"
        height="724"
        fetchPriority="high"
        decoding="async"
      />
      {/* The category header keeps a scrim: unlike the campaign art, category
          photos have no clear copy area, so the text needs a readable base. */}
      <div className="cartivo-hero-wash absolute inset-0 -z-10 hidden xl:block" aria-hidden="true" />
      <div className="relative flex flex-col justify-center px-4 py-5 sm:px-8 sm:py-6 xl:aspect-[2172/724] xl:px-14 xl:py-10">
        {/* Centred copy, kept inside the artwork's clearer left region at xl
            where the image sits behind the text. */}
        <div className="max-w-xl text-center">
          <div className="flex items-center justify-center gap-3 text-[var(--cartivo-banner-accent)]">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-current opacity-60" />
            <span className="cartivo-banner-eyebrow text-sm sm:text-base">
              {category ? "Curated for you" : "The CARTIVO collection"}
            </span>
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-current opacity-60" />
          </div>
          <h1 className="cartivo-banner-title mx-auto mt-2 max-w-xl text-[1.9rem] leading-[1.05] sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h1>
          <p className="cartivo-banner-description mx-auto mt-3 max-w-[14rem] text-sm leading-6 sm:max-w-[20rem] sm:text-[15px] lg:max-w-[26rem]">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

function LoadingGrid() {
  return (              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

export default function ProductCatalog({
  categorySlug = "",
  searchTerm = "",
  searchMode = false,
  showHero = false,
  description,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const sort = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const brand = searchParams.get("brand") || "";
  const inStockOnly = searchParams.get("inStock") === "true";

  const [categories, setCategories] = useState([]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const [rangeError, setRangeError] = useState("");

  useEffect(() => {
    let active = true;
    getCategories()
      .then((response) => {
        if (active) setCategories(Array.isArray(response.data) ? response.data : []);
      })
      .catch((requestError) => {
        if (active) setCategoriesError(requestError.message || "Could not load categories.");
      })
      .finally(() => {
        if (active) setCategoriesReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => setSearchInput(searchTerm), [searchTerm]);
  useEffect(() => {
    setMinInput(minPrice);
    setMaxInput(maxPrice);
  }, [minPrice, maxPrice]);

  const category = useMemo(
    () => categories.find((item) => item.slug === categorySlug),
    [categories, categorySlug]
  );
  const rootCategories = useMemo(() => categories.filter((item) => !item.parent), [categories]);
  const childCategories = useMemo(
    () =>
      category
        ? categories.filter((item) => String(getId(item.parent) || "") === String(category._id))
        : [],
    [categories, category]
  );
  const categoryIds = useMemo(
    () => (category ? getDescendantIds(categories, category._id) : []),
    [categories, category]
  );
  const rootCategory = useMemo(
    () => (category ? getRootCategory(category, categories) : null),
    [categories, category]
  );
  const categoryIdsKey = categoryIds.join(",");

  useEffect(() => {
    if (!categoriesReady) return;
    if (categorySlug && !category) {
      setLoading(false);
      setProducts([]);
      setError(
        categoriesError
          ? "We could not load this collection. Check your connection and try again."
          : "We could not find that category."
      );
      return;
    }
    if (searchMode && !searchTerm.trim()) {
      setLoading(false);
      setProducts([]);
      setMeta({ total: 0, page: 1, pages: 0 });
      setError("");
      return;
    }

    let active = true;
    const params = { page: String(page), limit: String(PAGE_SIZE), sort };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (categoryIdsKey) params.categories = categoryIdsKey;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (brand) params.brand = brand;
    if (inStockOnly) params.inStock = "true";

    setLoading(true);
    setError("");
    getProducts(params)
      .then((response) => {
        if (!active) return;
        setProducts(Array.isArray(response.data) ? response.data : []);
        setMeta(response.meta || { total: 0, page: 1, pages: 0 });
        setBrands(Array.isArray(response.facets?.brands) ? response.facets.brands : []);
      })
      .catch((requestError) => {
        if (!active) return;
        setProducts([]);
        setError(requestError.message || "Products could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    categoriesReady,
    categoriesError,
    categorySlug,
    category,
    categoryIdsKey,
    searchTerm,
    searchMode,
    queryString,
    page,
    sort,
    minPrice,
    maxPrice,
    brand,
    inStockOnly,
    retry,
  ]);

  useEffect(() => {
    document.title =
      searchMode && searchTerm
        ? "Search: " + searchTerm + " | CARTIVO"
        : category
          ? category.name + " | CARTIVO"
          : "All products | CARTIVO";
  }, [category, searchMode, searchTerm]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === "" || value === null || value === undefined || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    if (!Object.prototype.hasOwnProperty.call(updates, "page")) next.delete("page");
    setSearchParams(next);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const term = searchInput.trim();
    navigate(term ? "/search?q=" + encodeURIComponent(term) : "/products");
  };

  const applyPriceRange = (event) => {
    event.preventDefault();
    const low = minInput.trim();
    const high = maxInput.trim();
    if ((low && Number(low) < 0) || (high && Number(high) < 0)) {
      setRangeError("Enter a price of zero or more.");
      return;
    }
    if (low && high && Number(low) > Number(high)) {
      setRangeError("Minimum price must be lower than maximum price.");
      return;
    }
    setRangeError("");
    updateQuery({ minPrice: low, maxPrice: high });
    setMobileFiltersOpen(false);
  };

  const title = searchMode
    ? searchTerm
      ? "Results for “" + searchTerm + "”"
      : "Search our collection"
    : category
      ? category.name
      : "Explore all products";
  const pageDescription =
    description ||
    (category
      ? "Browse " + category.name.toLowerCase() + " picks, with useful details and clear pricing."
      : "Find something useful for every day, all in one place.");
  const breadcrumbParent =
    category && category.parent
      ? categories.find((item) => String(item._id) === String(getId(category.parent)))
      : null;
  const categoryMissing = Boolean(categorySlug && categoriesReady && !category);

  if (categorySlug && !categoriesReady) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[var(--color-muted)] sm:px-8">
        Loading collection…
      </div>
    );
  }

  return (      <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-5 lg:px-8 xl:px-12">
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)] sm:text-sm">
        <Link to="/" className="hover:text-[var(--color-primary-bright)]">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        {category ? (
          <>
            {breadcrumbParent ? (
              <>
                <Link to={"/category/" + breadcrumbParent.slug} className="hover:text-[var(--color-primary-bright)]">
                  {breadcrumbParent.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            ) : null}
            <span aria-current="page" className="font-semibold text-[var(--color-ink)]">{category.name}</span>
          </>
        ) : searchMode ? (
          <span aria-current="page" className="font-semibold text-[var(--color-ink)]">Search</span>
        ) : (
          <span aria-current="page" className="font-semibold text-[var(--color-ink)]">Products</span>
        )}
      </nav>

      {showHero || category ? (
        <CatalogHero
          title={title}
          description={pageDescription}
          category={category ? { ...category, root: rootCategory } : null}
        />
      ) : (            <section className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary-bright)]">
                Discover CARTIVO
              </p>
              <h1 className="mt-2 font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)] sm:text-base">{pageDescription}</p>
            </section>
      )}

      <form onSubmit={handleSearch} className="mb-6 flex w-full max-w-sm flex-col gap-2.5 sm:max-w-2xl sm:flex-row sm:items-center">
        <label htmlFor="catalog-search" className="sr-only">Search products</label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-faint)]" aria-hidden="true" />
          <input
            id="catalog-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products and brands"
            className="h-11 w-full rounded-full border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-bright)] focus:ring-2 focus:ring-[var(--color-primary-bright)]/15"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-bright)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-bright)] focus-visible:ring-offset-2 sm:w-auto"
        >
          Search
        </button>
      </form>

      {!category && !searchMode && rootCategories.length > 0 ? (
        <section className="mb-6" aria-labelledby="browse-categories-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="browse-categories-title" className="font-[var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
                Browse categories
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Explore the collections that interest you.</p>
            </div>
            <Link to="/products" className="hidden items-center gap-1 text-sm font-semibold text-[var(--color-primary-bright)] sm:inline-flex" aria-hidden="true">
              All products <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <span className="sm:hidden">All products</span>
          </div>              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-8">
            {rootCategories.map((item) => (
              <Link
                key={item._id}
                to={"/category/" + item.slug}
                className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:-translate-y-0.5 hover:border-sky-300"
              >
                <div className="aspect-[3/2] overflow-hidden bg-[var(--color-surface)]">
                  <CategoryImage slug={item.slug} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <span className="block truncate px-3 py-2.5 text-xs font-semibold text-[var(--color-ink)] sm:text-sm">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {category && childCategories.length > 0 ? (          <nav aria-label={category.name + " subcategories"} className="mb-6 flex flex-wrap gap-2">
          {childCategories.map((item) => (
            <Link
              key={item._id}
              to={"/category/" + item.slug}
              className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      ) : null}        <div className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-4 lg:flex-row lg:items-start lg:gap-8">
        <aside className="w-full shrink-0 lg:w-60">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            aria-expanded={mobileFiltersOpen}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] lg:hidden"
          >
            <span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Filters</span>
            {mobileFiltersOpen ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <div className={(mobileFiltersOpen ? "block" : "hidden") + " mt-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 lg:mt-0 lg:block"}>
            <div className="mb-5 flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--color-primary-bright)]" aria-hidden="true" />
              <h2 className="font-[var(--font-display)] text-base font-bold text-[var(--color-ink)]">Filter products</h2>
            </div>
            <section className="border-b border-[var(--color-border)] pb-5">
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Categories</h3>
              <ul className="space-y-2">
                <li><Link to="/products" className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-primary-bright)]">All products</Link></li>
                {rootCategories.map((item) => (
                  <li key={item._id}>
                    <Link
                      to={"/category/" + item.slug}
                      className={
                        "text-sm transition hover:text-[var(--color-primary-bright)] " +
                        (rootCategory?._id === item._id ? "font-semibold text-[var(--color-primary-bright)]" : "text-[var(--color-muted)]")
                      }
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            <form onSubmit={applyPriceRange} className="border-b border-[var(--color-border)] py-5">
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Price range</h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-[var(--color-muted)]">
                  Minimum
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={minInput}
                    onChange={(event) => setMinInput(event.target.value)}
                    placeholder="₹ 0"
                    className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary-bright)]"
                  />
                </label>
                <label className="text-xs text-[var(--color-muted)]">
                  Maximum
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={maxInput}
                    onChange={(event) => setMaxInput(event.target.value)}
                    placeholder="No limit"
                    className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary-bright)]"
                  />
                </label>
              </div>
              {rangeError ? <p role="alert" className="mt-2 text-xs text-[var(--color-danger)]">{rangeError}</p> : null}
              <button type="submit" className="mt-3 w-full rounded-lg bg-[var(--color-primary-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
              Apply price
            </button>
            </form>
            <label className="flex cursor-pointer items-center gap-2 pt-5 text-sm text-[var(--color-ink)]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(event) => updateQuery({ inStock: event.target.checked ? "true" : "" })}
                className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary-bright)]"
              />
              In stock only
            </label>
            <div className="border-b border-[var(--color-border)] py-5">
              <label htmlFor="catalog-brand" className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">Brand</label>
              <select
                id="catalog-brand"
                value={brand}
                onChange={(event) => updateQuery({ brand: event.target.value })}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary-bright)]"
              >
                <option value="">All brands</option>
                {brands.map((brandName) => <option key={brandName} value={brandName}>{brandName}</option>)}
              </select>
            </div>
            {(minPrice || maxPrice || brand || inStockOnly) ? (
              <button
                type="button"
                onClick={() => {
                  setMinInput("");
                  setMaxInput("");
                  setRangeError("");
                  updateQuery({ minPrice: "", maxPrice: "", brand: "", inStock: "" });
                }}
                className="mt-4 text-xs font-semibold text-[var(--color-primary-bright)] hover:underline"
              >Clear filters</button>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0 flex-1" aria-labelledby="product-results-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="product-results-title" className="font-[var(--font-display)] text-base font-bold text-[var(--color-ink)] sm:text-lg">
                {searchMode ? "Matching products" : category ? "Shop " + category.name : "Products"}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]" aria-live="polite">
                {loading ? "Updating results…" : meta.total + (meta.total === 1 ? " product" : " products")}
              </p>
            </div>
            <div
              className="hfx-nav-sliding-pill bg-white"
              role="group"
              aria-label="Sort products"
              data-count="4"
              style={{"--hfx-active": SORT_OPTIONS.findIndex((option) => option.value === sort)}}
            >
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={sort === option.value}
                  onClick={() => updateQuery({ sort: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-12 text-center">
              <p className="font-semibold text-[var(--color-ink)]">{error}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {categoryMissing ? (
                  <Link to="/products" className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white">Browse all products</Link>
                ) : !searchMode || searchTerm.trim() ? (
                  <button
                    type="button"
                    onClick={() => setRetry((value) => value + 1)}
                    className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-bright)]"
                  >
                    Try again
                  </button>
                ) : null}
              </div>
            </div>
          ) : loading ? (
            <LoadingGrid />
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">
                {searchMode ? "No matching products yet" : "No products found"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">
                Try changing the search or filters to see more of the collection.
              </p>
              <Link to="/products" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-bright)]">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Browse all products
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => <ProductCard key={product._id || product.slug} product={product} />)}
              </div>
              {meta.pages > 1 ? (
                <nav aria-label="Product pages" className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateQuery({ page: page - 1 })}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Previous
                  </button>
                  <span className="text-sm text-[var(--color-muted)]">Page {page} of {meta.pages}</span>
                  <button
                    type="button"
                    disabled={page >= meta.pages}
                    onClick={() => updateQuery({ page: page + 1 })}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
