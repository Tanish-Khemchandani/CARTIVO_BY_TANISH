/*
 * Ranking list where each row's bar is proportional to the leader. Used for
 * top products, top spenders and any other "who is biggest" panel - the
 * value is always printed, so the bar is reinforcement rather than the data.
 */
export default function BarList({
  items = [],
  labelKey = "label",
  valueKey = "value",
  secondaryKey = "",
  formatValue = (value) => String(value),
  color = "var(--color-primary)",
  emptyMessage = "Nothing here yet.",
}) {
  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 0);

  if (items.length === 0 || max === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const share = max > 0 ? (value / max) * 100 : 0;
        return (
          <li key={item.id || item[labelKey] || index}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-[var(--color-ink)]" title={item[labelKey]}>
                {item[labelKey]}
              </span>
              <span className="shrink-0 font-medium text-white">{formatValue(value)}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                <span
                  className="block h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${Math.max(share, 2)}%`, background: color }}
                />
              </span>
              {secondaryKey ? (
                <span className="shrink-0 text-xs text-[var(--color-muted)]">
                  {item[secondaryKey]}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
