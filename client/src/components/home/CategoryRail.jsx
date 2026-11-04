import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCategories } from "../../api/categories";

const CATEGORY_ICONS = {
  "mobiles": "/assets/campaign/category-cards/mobiles.webp",
  "fashion": "/assets/campaign/category-cards/fashion.webp",
  "electronics": "/assets/campaign/category-cards/electronics.webp",
  "appliances": "/assets/campaign/category-cards/appliances.webp",
  "grocery": "/assets/campaign/category-cards/grocery.webp",
  "home-beauty": "/assets/campaign/category-cards/home-beauty.webp",
  "furniture": "/assets/campaign/category-cards/furniture.webp",
};

const CATEGORY_TAGS = {
  "mobiles": "Smartphones & More",
  "fashion": "Trendy Apparel",
  "electronics": "Audio & Gaming",
  "appliances": "Home & Kitchen",
  "grocery": "Daily Essentials",
  "home-beauty": "Decor & Skincare",
  "furniture": "Living & Bedroom",
};

export default function CategoryRail() {
  const [categories, setCategories] = useState([]);
  const railRef = useRef(null);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.filter((c) => !c.parent)))
      .catch(() => setCategories([]));
  }, []);

  const scroll = (direction) => {
    if (railRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      railRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (categories.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
      <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div>
          <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)] tracking-tight">
            Shop by Category
          </h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Explore our curated collections with exclusive deals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Link
            to="/products"
            className="ml-2 text-sm font-semibold text-[var(--color-primary-bright)] hover:underline flex items-center gap-1"
          >
            View all <span>→</span>
          </Link>
        </div>
      </div>

      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pt-5 pb-6 sm:gap-4"
      >
        {categories.map((cat) => {
          const iconSrc = CATEGORY_ICONS[cat.slug];
          const tag = CATEGORY_TAGS[cat.slug] || "Explore Now";
          return (
            <Link
              key={cat._id}
              to={`/category/${cat.slug}`}
              className="group relative flex w-[calc((100%-0.75rem)/2)] shrink-0 snap-start flex-col items-center justify-between rounded-3xl border-2 border-slate-100 bg-white p-3 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-400 sm:w-[185px] sm:p-6 lg:w-[205px]"
            >
              {/* Outer Glowing Aura & Square Container matching screenshot */}
              <div className="relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-sky-50 to-blue-50/40 p-1.5 border border-sky-100 ring-4 ring-sky-50/70 transition-all duration-300 group-hover:scale-105 group-hover:ring-sky-100">
                {iconSrc ? (
                  <img
                    src={iconSrc}
                    alt={cat.name}
                    className="h-full w-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-xl sm:rounded-2xl bg-[var(--color-primary-soft)] font-[var(--font-display)] text-2xl font-bold text-[var(--color-primary)]">
                    {cat.name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Category Name & Subtitle */}
              <div className="mt-4 flex flex-col items-center">
                <span className="font-[var(--font-display)] text-sm sm:text-base sm:text-lg font-bold text-[var(--color-ink)] group-hover:text-sky-600 transition-colors line-clamp-1">
                  {cat.name}
                </span>
                <span className="mt-0.5 text-[11px] font-medium text-slate-400 group-hover:text-sky-500 transition-colors">
                  {tag}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
