// placeholder for a page whose real functionality has not been built yet.
// per the project spec: mark unfinished features as TODO rather than
// faking data or behavior that is not really there.
export default function ComingSoon({ title, note }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-6 py-24 text-center">
      <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">{title}</h1>
      <p className="text-sm text-[var(--color-muted)]">{note || "This page is not built yet."}</p>
    </div>
  );
}
