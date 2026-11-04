// Shared intro block for the informational pages (about, contact, FAQs,
// track order). Keeps the type scale and spacing consistent.
export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="max-w-3xl">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary-bright)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl lg:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)] sm:text-base sm:leading-7">
          {description}
        </p>
      ) : null}
      {children}
    </header>
  );
}
