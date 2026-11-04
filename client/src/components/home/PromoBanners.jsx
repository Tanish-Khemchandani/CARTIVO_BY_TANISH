import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const banners = [
  {
    src: "/assets/campaign/promo-curated.png",
    alt: "Curated home and lifestyle essentials arranged in a neutral studio",
    href: "/products",
    eyebrow: "The CARTIVO edit",
    title: <>Little things, <em>well chosen.</em></>,
    action: "Browse the edit",
  },
  {
    src: "/assets/campaign/promo-tech.png",
    alt: "A considered selection of modern personal technology",
    href: "/category/electronics",
    eyebrow: "Everyday technology",
    title: <>Smart choices, <em>made simple.</em></>,
    action: "Explore tech",
  },
  {
    src: "/assets/campaign/promo-festive.png",
    alt: "Elegant gift boxes and festive decor",
    href: "/products",
    eyebrow: "Made for sharing",
    title: <>Thoughtful gifts, <em>for every moment.</em></>,
    action: "Find a gift",
  },
  {
    src: "/assets/campaign/promo-style.png",
    alt: "Contemporary style and accessories in a bright studio",
    href: "/category/fashion",
    eyebrow: "A fresh perspective",
    title: <>Style that feels <em>like you.</em></>,
    action: "Discover style",
  },
];

export default function PromoBanners() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <section className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16" aria-label="Explore CARTIVO collections">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:gap-4">
        {banners.map((banner, index) => (
          <Link
            key={banner.src}
            to={banner.href}
            style={{ animationDelay: `${index * 70}ms` }}
            className={`cartivo-promo cartivo-banner-reveal group flex flex-col overflow-hidden rounded-3xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-bright)] ${dark ? "cartivo-promo-dark" : "cartivo-promo-light"}`}
          >
            <div className="relative overflow-hidden">
              <img
                src={banner.src}
                alt={banner.alt}
                className="block h-auto w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.025]"
                loading="lazy"
                decoding="async"
                width="1448"
                height="1086"
              />
            </div>
            {/* Copy sits below the artwork, so it is centred across the card. */}
            <div className="flex flex-1 flex-col items-center p-4 text-center sm:p-5">
              <div className="flex w-full items-center justify-center gap-2.5 text-[var(--cartivo-banner-accent)]">
                <span aria-hidden="true" className="h-px w-6 shrink-0 bg-current opacity-60" />
                <p className="cartivo-banner-eyebrow text-sm">{banner.eyebrow}</p>
                <span aria-hidden="true" className="h-px w-6 shrink-0 bg-current opacity-60" />
                {/* the index reads as a footnote mark on the centred label */}
                <sup aria-hidden="true" className="font-[var(--font-editorial)] text-[10px] leading-none opacity-70">
                  {String(index + 1).padStart(2, "0")}
                </sup>
              </div>
              <h2 className="cartivo-banner-title mx-auto mt-2 max-w-[15rem] text-[1.5rem] leading-[1.08] sm:text-[1.65rem]">
                {banner.title}
              </h2>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-[var(--cartivo-banner-ink)]">
                <span className="cartivo-banner-link">{banner.action}</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
