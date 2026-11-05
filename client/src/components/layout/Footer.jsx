import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, RotateCcw, ShieldCheck, CreditCard } from "lucide-react";
import { api } from "../../api/client";
import BrandLogo from "../brand/BrandLogo";

// Fallbacks keep the footer intact while the settings document is loading
// or if /api/settings is unreachable.
const DEFAULTS = {
  siteName: "CARTIVO",
  tagline: "Your trusted destination for premium products, delivered fast and securely across India.",
  contactEmail: "sumitback1@gmail.com",
  contactPhone: "9687697881",
  address: "Vadodara, Gujarat, India",
  supportHours: "Mon - Sat: 9:00am - 6:00pm",
  footerText: "Made with care for Bharat",
  social: {},
};

const SOCIAL_LABELS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "X (Twitter)" },
  { key: "youtube", label: "YouTube" },
];

const benefits = [
  {
    icon: Truck,
    title: "Free delivery",
    desc: "On orders above ₹499",
    color: "from-sky-500/10 to-blue-500/10 text-sky-600",
  },
  {
    icon: RotateCcw,
    title: "Easy returns",
    desc: "7-day hassle-free returns",
    color: "from-sky-500/10 to-blue-500/10 text-blue-600",
  },
  {
    icon: ShieldCheck,
    title: "100% authentic",
    desc: "Verified genuine products",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600",
  },
  {
    icon: CreditCard,
    title: "Payment details",
    desc: "Cash on Delivery only",
    color: "from-cyan-500/10 to-blue-500/10 text-cyan-600",
  },
];

const companyLinks = [
  { label: "Home", to: "/" },
  { label: "About us", to: "/about" },
  { label: "Contact us", to: "/contact" },
  { label: "FAQs", to: "/faqs" },
  { label: "Track order", to: "/track-order" },
];

const policyLinks = [
  { label: "Privacy policy", to: "/privacy-policy" },
  { label: "Return policy", to: "/return-policy" },
  { label: "Shipping & delivery", to: "/shipping-delivery" },
  { label: "Refund policy", to: "/refund-policy" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    let active = true;
    api
      .get("/settings")
      .then((response) => {
        if (active) setSettings({ ...DEFAULTS, ...response.data, social: response.data?.social || {} });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleSubscribe(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      await api.post("/newsletter/subscribe", { email });
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* benefits bar */}        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-4 px-4 py-6 sm:gap-4 sm:px-6 lg:grid-cols-4 lg:px-8 xl:px-12 2xl:px-16">
        {benefits.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="group flex items-center gap-2.5 sm:gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${b.color} border border-white/60 shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12`}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="font-[var(--font-display)] text-sm font-bold text-[var(--color-ink)]">
                  {b.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">{b.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[var(--color-border)]" />

      {/* main footer grid */}        <div className="w-full grid grid-cols-1 gap-6 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="inline-block">
            <BrandLogo className="h-10 sm:h-11 lg:h-12" />
          </Link>
          <p className="mt-3 text-sm text-[var(--color-muted)]">{settings.tagline}</p>
          <div className="mt-4 space-y-1 text-sm text-[var(--color-muted)]">
            {settings.contactPhone ? (
              <p>
                Call us: <a href={`tel:${settings.contactPhone}`} className="hover:text-[var(--color-primary)] transition">{settings.contactPhone}</a>
              </p>
            ) : null}
            {settings.contactEmail ? (
              <p>
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-[var(--color-primary)] transition">{settings.contactEmail}</a>
              </p>
            ) : null}
            {settings.address ? <p>{settings.address}</p> : null}
            {SOCIAL_LABELS.filter(({ key }) => settings.social?.[key]).length > 0 && (
              <p className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                {SOCIAL_LABELS.filter(({ key }) => settings.social?.[key]).map(({ key, label }) => (
                  <a key={key} href={settings.social[key]} target="_blank" rel="noreferrer" className="hover:text-[var(--color-primary)] transition">
                    {label}
                  </a>
                ))}
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Company</p>
          <ul className="space-y-2 text-sm text-[var(--color-muted)]">
            {companyLinks.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="hover:text-[var(--color-primary)] transition">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Policies</p>
          <ul className="space-y-2 text-sm text-[var(--color-muted)]">
            {policyLinks.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="hover:text-[var(--color-primary)] transition">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm font-semibold text-[var(--color-ink)]">Support hours</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{settings.supportHours}</p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Stay in the loop</p>
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            Get exclusive deals, new arrivals and offers delivered to your inbox.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2">        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm outline-none focus:border-[var(--color-primary-bright)] transition"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? "..." : "Send"}
            </button>
          </div>
          </form>
          {status === "done" && <p className="mt-2 text-xs text-[var(--color-success)]">Subscribed.</p>}
          {status === "error" && <p className="mt-2 text-xs text-[var(--color-danger)]">Something went wrong.</p>}
          <p className="mt-3 text-xs text-[var(--color-faint)]">We respect your privacy. No spam ever.</p>
        </div>
      </div>

      {/* Payment logos */}
      <div className="border-t border-[var(--color-border)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4">
          <p className="mb-3 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
            Payment method
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 shadow-xs">
              Cash on Delivery
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              Pay in cash when your order arrives. Online payments are not available yet.
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)]">
        <div className="w-full flex flex-col items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 text-xs text-[var(--color-muted)] sm:flex-row">
          <p>© 2026 {settings.siteName}. All rights reserved.</p>
          <a href="https://tanishkhemchandani.vercel.app" target="_blank" rel="noopener noreferrer" className="footer-credit inline-flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-[var(--color-muted)] transition-colors duration-200 hover:border-[#C90000] focus-visible:border-[#C90000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] focus-visible:ring-offset-2"
            aria-label="Designed and Developed by Tanish Khemchandani — opens portfolio in a new tab"
          >
            <span className="relative z-[1] text-base font-semibold tracking-wide sm:text-lg">Designed and Developed by</span>
            <img
              src="/assets/brand/tk-logo.png"
              alt="TK"
              width="42"
              height="42"
              loading="lazy"
              decoding="async"
              className="relative z-[1] h-12 w-auto object-contain sm:h-14"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
