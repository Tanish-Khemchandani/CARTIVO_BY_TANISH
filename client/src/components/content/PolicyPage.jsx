import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MessageCircle } from "lucide-react";

export function PolicyLink({ to, children }) {
  return (
    <Link to={to} className="font-medium text-[var(--color-primary-bright)] underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}

/*
 * Every storefront policy shares the same structure: breadcrumb, title,
 * short summary, "last updated" date, numbered sections and a support
 * callout. The copy itself lives next to each route so it can be reviewed
 * on its own.
 */
export default function PolicyPage({ title, summary, updated, updatedISO, sections }) {
  useEffect(() => {
    document.title = title + " | CARTIVO";
  }, [title]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)] sm:text-sm">
        <Link to="/" className="hover:text-[var(--color-primary-bright)]">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span aria-current="page" className="font-semibold text-[var(--color-ink)]">{title}</span>
      </nav>

      <header className="border-b border-[var(--color-border)] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary-bright)]">
          Store policies
        </p>
        <h1 className="mt-2 font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)] sm:text-base sm:leading-7">
          {summary}
        </p>
        <p className="mt-3 text-xs text-[var(--color-faint)]">
          Last updated <time dateTime={updatedISO}>{updated}</time>
        </p>
      </header>

      <div className="mt-7 space-y-7 sm:mt-9 sm:space-y-9">
        {sections.map((section, index) => {
          const id = "policy-section-" + (index + 1);
          return (
            <section key={section.heading} aria-labelledby={id}>
              <h2 id={id} className="font-[var(--font-display)] text-base font-bold text-[var(--color-ink)] sm:text-lg">
                {index + 1}. {section.heading}
              </h2>
              <div className="mt-2 space-y-3 text-sm leading-7 text-[var(--color-muted)]">
                {section.body}
              </div>
            </section>
          );
        })}
      </div>

      <aside className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-primary-bright)]">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-[var(--font-display)] text-base font-bold text-[var(--color-ink)]">
              Questions about this policy?
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Send us your order number and we will explain how this applies to your purchase.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
              <Link
                to="/contact"
                className="text-[var(--color-primary-bright)] underline-offset-2 hover:underline"
              >
                Contact support
              </Link>
              <Link
                to="/faqs"
                className="text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-primary-bright)] hover:underline"
              >
                Read the FAQs
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
