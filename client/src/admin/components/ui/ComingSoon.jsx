export default function ComingSoon({ title, note }) {
  return (
    <div className="flex flex-col items-center gap-2 py-24 text-center">
      <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">{title}</h1>
      <p className="text-sm text-[var(--color-muted)]">{note || "This page is not built yet."}</p>
    </div>
  );
}
