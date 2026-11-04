import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

// Typographic brand tiles: per-brand wordmarks and identity colors instead of
// photos, so the section stays clean and there is no third-party imagery to
// license. Each entry only carries visual identity data + a catalog link.
const brands = [
  {
    name: "Apple",
    wordmark: "APPLE",
    tagline: "iPhone 15 Series & Mac",
    subtext: "Titanium design, A17 Pro chip",
    bg: "linear-gradient(135deg, #464646 0%, #1d1d1f 100%)",
    text: "#f5f5f7",
    accent: "#a1a1a6",
    glyph: "A",
    link: "/category/mobiles-apple",
    badge: "Official Store",
  },
  {
    name: "Samsung",
    wordmark: "SAMSUNG",
    tagline: "Galaxy S24 Ultra & AI",
    subtext: "Next-gen Galaxy AI experience",
    bg: "linear-gradient(135deg, #1428a0 0%, #0a1e6e 100%)",
    text: "#ffffff",
    accent: "#8fb8ff",
    glyph: "S",
    link: "/category/mobiles-samsung",
    badge: "Flagship Deals",
  },
  {
    name: "OnePlus",
    wordmark: "ONEPLUS",
    tagline: "OnePlus 12 Series",
    subtext: "Smooth Beyond Belief",
    bg: "linear-gradient(135deg, #2b2b2b 0%, #101010 100%)",
    text: "#ffffff",
    accent: "#eb0028",
    glyph: "1+",
    link: "/category/mobiles-oneplus",
    badge: "Top Seller",
    glyphColor: "#eb0028",
  },
  {
    name: "Xiaomi / MI",
    wordmark: "XIAOMI",
    tagline: "Xiaomi 14 & Smart Living",
    subtext: "Leica optics & ecosystem",
    bg: "linear-gradient(135deg, #ff6900 0%, #cc4f00 100%)",
    text: "#ffffff",
    accent: "#ffe3cc",
    glyph: "MI",
    link: "/category/mobiles-mi",
    badge: "Best Value",
  },
  {
    name: "Realme",
    wordmark: "realme",
    tagline: "Realme GT Series",
    subtext: "Dare to leap performance",
    bg: "linear-gradient(135deg, #ffc915 0%, #f2a900 100%)",
    text: "#1a1a1a",
    accent: "#6b5a00",
    glyph: "R",
    link: "/category/mobiles-realme",
    badge: "Youth Choice",
  },
  {
    name: "Vivo",
    wordmark: "vivo",
    tagline: "Vivo X100 Pro",
    subtext: "Zeiss professional imaging",
    bg: "linear-gradient(135deg, #415fff 0%, #0026d9 100%)",
    text: "#ffffff",
    accent: "#b8c6ff",
    glyph: "v",
    link: "/category/mobiles-vivo",
    badge: "Camera Phone",
  },
];

export default function FeaturedBrands() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-7">
      <div className="mb-4 flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div>
          <h2 className="font-[var(--font-display)] text-xl sm:text-2xl font-bold text-[var(--color-ink)]">
            Official Brand Stores
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            100% authentic devices backed by manufacturer warranty
          </p>
        </div>
        <Link
          to="/category/mobiles"
          className="text-sm font-semibold text-[var(--color-primary-bright)] hover:underline flex items-center gap-1"
        >
          View all phones <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-6">
        {brands.map((b) => (
          <Link
            key={b.name}
            to={b.link}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-400"
          >
            {/* Brand identity tile (replaces the old photo) */}
            <div
              className="relative flex aspect-square w-full items-center justify-center overflow-hidden"
              style={{ background: b.bg }}
              role="img"
              aria-label={`${b.name} brand tile`}
            >
              <span
                className="font-[var(--font-display)] select-none leading-none transition-transform duration-500 group-hover:scale-110"
                style={{
                  color: b.glyphColor || b.text,
                  fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  textShadow: "0 2px 18px rgba(0,0,0,0.22)",
                }}
                aria-hidden="true"
              >
                {b.glyph}
              </span>

              {/* wordmark strip along the bottom of the tile */}
              <span
                className="absolute bottom-2.5 left-0 right-0 text-center font-[var(--font-display)] text-[11px] font-bold uppercase tracking-[0.32em] opacity-90 select-none"
                style={{ color: b.accent }}
                aria-hidden="true"
              >
                {b.wordmark}
              </span>

              <span
                className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-xs"
                style={{
                  color: b.text,
                  background: "rgba(0,0,0,0.35)",
                }}
              >
                {b.badge}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-[var(--font-display)] text-sm font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary-bright)] transition-colors">
                  {b.name}
                </h3>
                <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:text-[var(--color-primary-bright)]" />
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-[var(--color-muted)]">
                {b.tagline}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
