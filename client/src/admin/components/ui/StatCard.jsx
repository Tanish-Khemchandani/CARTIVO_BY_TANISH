export default function StatCard({ label, value, hint = "", tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "text-[var(--color-danger)]"
      : tone === "warning"
      ? "text-[var(--color-warning)]"
      : "text-white";

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <p className={`mt-2 break-words font-[var(--font-display)] text-2xl font-bold sm:text-3xl ${toneClass}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p> : null}
    </div>
  );
}
