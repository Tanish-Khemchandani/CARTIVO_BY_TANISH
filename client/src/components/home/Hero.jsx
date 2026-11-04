import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const campaigns = [
  {
    eyebrow: "Thoughtfully chosen for you",
    title: <>Good finds. <span className="block">Better everyday.</span></>,
    description: "Explore considered picks for your home, style and everyday tech.",
    image: "/assets/campaign/hero-light.png",
    alt: "A curated selection of premium electronics and everyday essentials",
    href: "/products",
    action: "Explore the collection",
  },
  {
    eyebrow: "Smarter everyday",
    title: <>Technology that <span className="block">fits your life.</span></>,
    description: "Discover useful tech, thoughtfully picked for every day.",
    image: "/assets/campaign/heroes/hero-tech.webp",
    alt: "A premium smartphone, laptop, watch and wireless earbuds",
    href: "/category/electronics",
    action: "Explore electronics",
  },
  {
    eyebrow: "At home",
    title: <>Make room for <span className="block">better living.</span></>,
    description: "Comforting details and considered pieces for your space.",
    image: "/assets/campaign/heroes/hero-home.webp",
    alt: "A calm contemporary living room with a sculptural chair and warm details",
    href: "/category/furniture",
    action: "Shop home finds",
  },
  {
    eyebrow: "Personal style",
    title: <>Find your everyday <span className="block">signature.</span></>,
    description: "A fresh edit of pieces made to feel like you.",
    image: "/assets/campaign/heroes/hero-style.webp",
    alt: "A refined edit of contemporary clothing, accessories and footwear",
    href: "/category/fashion",
    action: "Explore fashion",
  },
];

export default function Hero() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [activeIndex, setActiveIndex] = useState(0);
  const campaign = campaigns[activeIndex];
  const campaignImage = activeIndex === 0
    ? dark ? "/assets/campaign/hero-dark.png" : "/assets/campaign/hero-light.png"
    : campaign.image;
  const showCampaign = (index) => setActiveIndex((index + campaigns.length) % campaigns.length);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % campaigns.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  // Non-default slides use bright artwork; preserve readable dark copy in
  // light mode and switch the copy to a light palette in dark mode.
  const darkArt = dark;

  return (
    <div className="mx-auto w-full max-w-[1360px] px-3 pt-3 sm:px-5 sm:pt-5 lg:px-8">
      <section
        className={`cartivo-hero relative isolate overflow-hidden rounded-3xl ${darkArt ? "cartivo-hero-dark" : "cartivo-hero-light"}`}
        aria-labelledby="home-hero-title"
        aria-roledescription="carousel"
      >
        {/* Below xl the artwork sits in the flow at its natural 3:1 ratio, so the
            whole picture is visible; from xl the panel uses the same ratio and the
            image fills it behind the copy without cropping anything. */}
        <img
          key={campaignImage}
          src={campaignImage}
          alt={campaign.alt}
          className="cartivo-campaign-art block h-auto w-full object-contain xl:absolute xl:inset-0 xl:-z-20 xl:h-full xl:object-cover"
          width="2172"
          height="724"
          fetchPriority="high"
          decoding="async"
        />
        <div className="px-5 pb-5 pt-5 sm:px-9 sm:pb-7 sm:pt-6 xl:flex xl:aspect-[2172/724] xl:items-center xl:px-14 xl:py-10">
          {/* Centred copy. The artwork keeps its product cluster on the right,
              so the block stays over the clear studio space on the left at xl
              instead of being pulled across the products. */}
          <div key={campaign.eyebrow} className="cartivo-banner-reveal max-w-[34rem] text-center">
            <div className="flex items-center justify-center gap-3 text-[var(--cartivo-banner-accent)]">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-current opacity-60" />
              <p className="cartivo-banner-eyebrow text-base sm:text-lg">{campaign.eyebrow}</p>
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-current opacity-60" />
            </div>
            <h1 id="home-hero-title" className={`cartivo-banner-title mx-auto mt-2 max-w-[19rem] text-[2.2rem] leading-[1.03] sm:max-w-xl sm:text-[3.1rem] lg:text-[3.6rem] ${dark && activeIndex > 0 ? "cartivo-hero-title-dark" : ""}`} >
              {campaign.title}
            </h1>
            <p className={`cartivo-banner-description mx-auto mt-4 max-w-[17rem] text-sm leading-6 sm:max-w-md sm:text-[15px] sm:leading-7 ${dark && activeIndex > 0 ? "cartivo-hero-copy-dark" : ""}`} >
              {campaign.description}
            </p>
            <Link
              to={campaign.href}
              className={`group mt-5 inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-[var(--cartivo-banner-ink)] transition-colors hover:text-[var(--cartivo-banner-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-bright)] focus-visible:ring-offset-2 ${dark && activeIndex > 0 ? "cartivo-hero-link-dark" : ""}`} 
            >
              <span className="cartivo-banner-link">{campaign.action}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-5 pb-5 sm:px-9 sm:pb-6 xl:absolute xl:bottom-5 xl:right-5 xl:gap-2 xl:px-0 xl:pb-0" aria-label="Hero banners">
          <button
            type="button"
            onClick={() => showCampaign(activeIndex - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 text-[var(--color-ink)] backdrop-blur transition hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:h-9 sm:w-9"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          {campaigns.map((item, index) => (
            <button
              key={item.eyebrow}
              type="button"
              onClick={() => showCampaign(index)}
              className="group flex h-8 items-center px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              aria-label={`Show banner ${index + 1}: ${item.eyebrow}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <span
                aria-hidden="true"
                className={`block h-[2px] transition-all ${index === activeIndex ? "w-6 bg-[var(--color-primary)]" : "w-3 bg-[var(--color-faint)]/70 group-hover:bg-[var(--color-primary-bright)]"}`}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => showCampaign(activeIndex + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 text-[var(--color-ink)] backdrop-blur transition hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:h-9 sm:w-9"
            aria-label="Next banner"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
