/*
 * Vertical bars with an optional second series drawn as a line over them
 * (revenue bars + order line on the dashboard). Bars are plain elements so
 * they animate with CSS; the line is one SVG overlay scaled to the same
 * box, with a non-scaling stroke so it stays crisp at any width.
 */
export default function BarChart({
  points = [],
  primaryKey = "value",
  secondaryKey = "",
  formatPrimary = (value) => String(value),
  formatSecondary = (value) => String(value),
  height = 220,
  primaryLabel = "",
  secondaryLabel = "",
  emptyMessage = "Nothing to show for this range yet.",
}) {
  const primaryValues = points.map((point) => Number(point[primaryKey] || 0));
  const secondaryValues = points.map((point) => Number(point[secondaryKey] || 0));
  const maxPrimary = Math.max(...primaryValues, 0);
  const maxSecondary = Math.max(...secondaryValues, 0);
  const total = primaryValues.reduce((sum, value) => sum + value, 0);
  const labelEvery = points.length > 12 ? Math.ceil(points.length / 8) : 1;

  if (points.length === 0 || (maxPrimary === 0 && maxSecondary === 0)) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-muted)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
        {primaryLabel ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-primary)]" aria-hidden="true" />
            {primaryLabel}
          </span>
        ) : null}
        {secondaryKey && secondaryLabel ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
            {secondaryLabel}
          </span>
        ) : null}
      </div>

      <div className="relative mt-3" style={{ height }}>
        {/* gridlines: 0 / 50 / 100% of the primary scale */}
        <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2].map((line) => (
            <span key={line} className="border-t border-[var(--color-border)]/60 first:border-t-0" />
          ))}
        </div>

        {secondaryKey && maxSecondary > 0 ? (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={points
                .map((point, index) => {
                  const x = ((index + 0.5) / points.length) * 100;
                  const y = 100 - (Number(point[secondaryKey] || 0) / maxSecondary) * 100;
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}

        <div className="relative flex h-full items-end gap-[3px] sm:gap-1.5">
          {points.map((point, index) => {
            const value = Number(point[primaryKey] || 0);
            const secondaryValue = Number(point[secondaryKey] || 0);
            const ratio = maxPrimary > 0 ? value / maxPrimary : 0;
            const isLast = index === points.length - 1;
            const title = [
              point.fullLabel || point.label,
              `${formatPrimary(value)}${primaryLabel ? ` ${primaryLabel.toLowerCase()}` : ""}`,
              secondaryKey ? `${formatSecondary(secondaryValue)}${secondaryLabel ? ` ${secondaryLabel.toLowerCase()}` : ""}` : "",
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={point.key || point.label || index}
                className="group flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end"
                title={title}
              >
                <div
                  className={`w-full max-w-12 rounded-t transition-[height] duration-300 ${
                    isLast ? "bg-[var(--color-primary)]" : "bg-[var(--color-primary)]/45"
                  } group-hover:bg-[var(--color-primary-bright)] ${value > 0 ? "" : "bg-[var(--color-surface-soft)]"}`}
                  style={{ height: `${value > 0 ? Math.max(ratio * 100, 3) : 1.5}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-[3px] sm:gap-1.5">
        {points.map((point, index) => (
          <span
            key={point.key || point.label || index}
            className="min-w-0 flex-1 truncate text-center text-[10px] text-[var(--color-muted)]"
          >
            {index % labelEvery === 0 || points.length <= 12 ? point.label : ""}
          </span>
        ))}
      </div>

      {total === 0 ? (
        <p className="mt-3 text-xs text-[var(--color-muted)]">{emptyMessage}</p>
      ) : null}
    </div>
  );
}
