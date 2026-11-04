import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  MapPin,
  MessageCircle,
  Package,
  RotateCcw,
} from "lucide-react";
import PageHeader from "../components/content/PageHeader";
import useSettings from "../hooks/useSettings";

const principles = [
  {
    icon: Package,
    title: "One place to shop",
    copy: "Mobiles, electronics, fashion, furniture, beauty and everyday groceries, organised into clear collections.",
  },
  {
    icon: CreditCard,
    title: "Clear pricing",
    copy: "Product prices and the delivery fee are calculated before you order, with Cash on Delivery at the door.",
  },
  {
    icon: RotateCcw,
    title: "Room to change your mind",
    copy: "A 7-day return window, a written return process and support you can reach when something goes wrong.",
  },
];

const promises = [
  "Stock status is shown on the product page and updated from the catalogue.",
  "Order totals are calculated by the store, not by the browser.",
  "Free delivery on orders of ₹499 or more, and a flat ₹49 below that.",
  "Cash on Delivery, with the amount due shown before you order.",
  "Wishlists that work on this device, or sync to your account when you sign in.",
];

export default function About() {
  const settings = useSettings();

  useEffect(() => {
    document.title = "About CARTIVO";
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[var(--color-muted)] sm:text-sm">
        <Link to="/" className="hover:text-[var(--color-primary-bright)]">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-semibold text-[var(--color-ink)]">About CARTIVO</span>
      </nav>

      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <PageHeader
          eyebrow="About CARTIVO"
          title="Everyday things, chosen with care."
          description="CARTIVO is an online store for the things you use every day — phones and electronics, fashion, home and kitchen, beauty and groceries — brought together with clear product details and a checkout that is easy to understand."
        >
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
            >
              Browse the collection <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
            >
              Talk to us
            </Link>
          </div>
        </PageHeader>

        <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <img
            src="/assets/campaign/promo-curated.png"
            alt="A considered arrangement of home and lifestyle products"
            className="aspect-[4/3] h-full w-full object-cover"
            width="1456"
            height="1024"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      <section className="mt-12 sm:mt-16" aria-labelledby="about-principles-title">
        <h2 id="about-principles-title" className="font-[var(--font-display)] text-xl font-bold text-[var(--color-ink)] sm:text-2xl">
          What we are building
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {principles.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-[var(--font-display)] text-base font-bold text-[var(--color-ink)]">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-8 sm:mt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12" aria-labelledby="about-promises-title">
        <div>
          <h2 id="about-promises-title" className="font-[var(--font-display)] text-xl font-bold text-[var(--color-ink)] sm:text-2xl">
            How the store works
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
            We would rather explain the process plainly than make promises the checkout cannot keep. Here
            is what you can expect on every order.
          </p>
          <ul className="mt-5 space-y-3">
            {promises.map((promise) => (
              <li key={promise} className="flex items-start gap-2.5 text-sm leading-6 text-[var(--color-muted)]">
                <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-success)]" aria-hidden="true" />
                {promise}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
          <MapPin className="h-6 w-6 text-[var(--color-primary-bright)]" aria-hidden="true" />
          <h2 className="mt-3 font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">
            Based in Vadodara
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">
            {settings.address}. Orders are packed and dispatched from here to addresses across India.
          </p>
          <dl className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Support hours</dt>
              <dd className="mt-0.5">{settings.supportHours}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Email</dt>
              <dd className="mt-0.5 break-all">
                <a href={"mailto:" + settings.contactEmail} className="hover:text-[var(--color-primary-bright)]">
                  {settings.contactEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Phone</dt>
              <dd className="mt-0.5">
                <a href={"tel:" + settings.contactPhone} className="hover:text-[var(--color-primary-bright)]">
                  {settings.contactPhone}
                </a>
              </dd>
            </div>
          </dl>
          <Link
            to="/contact"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-bright)] hover:underline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Contact support
          </Link>
        </div>
      </section>
    </div>
  );
}
