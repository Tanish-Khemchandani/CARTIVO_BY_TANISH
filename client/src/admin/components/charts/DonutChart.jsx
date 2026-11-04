/*
 * Share-of-total ring. Segments are drawn as SVG arcs with a small gap, and
 * the legend carries the real numbers (a chart is never the only place a
 * value appears).
 */
const PALETTE = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-success)",
  "var(--color-warning)",
  "#a78bfa",
  "var(--color-muted)",
];

function polar(cx, cy, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function arcPath(cx, cy, radius, startAngle, endAngle, thickness) {
  const outerStart = polar(cx, cy, radius, startAngle);
  const outerEnd = polar(cx, cy, radius, endAngle);
  const innerEnd = polar(cx, cy, radius - thickness, endAngle);
  const innerStart = polar(cx, cy, radius - thickness, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${radius - thickness} ${radius - thickness} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export default function DonutChart({
  slices = [],
  formatValue = (value) => String(value),
  centerLabel = "",
  centerValue = "",
  emptyMessage = "Nothing to break down yet.",
}) {
  const usable = slices.filter((slice) => Number(slice.value || 0) > 0);
  const total = usable.reduce((sum, slice) => sum + Number(slice.value || 0), 0);

  if (usable.length === 0 || total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted)]">
        {emptyMessage}
      </p>
    );
  }

  let angle = 0;
  const segments = usable.map((slice, index) => {
    const share = Number(slice.value) / total;
    const start = angle;
    // a hair of padding between arcs keeps the segments readable
    const end = angle + share * 360;
    angle = end - 0.8;
    return {
      ...slice,
      share,
      color: slice.color || PALETTE[index % PALETTE.length],
      path: arcPath(50, 50, 44, start, Math.max(end - 0.8, start + 0.4), 14),
    };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 100 100" className="h-36 w-36" role="img" aria-label={segments.map((segment) => `${segment.label} ${formatValue(segment.value)}, ${Math.round(segment.share * 100)} percent`).join("; ")}>
          {segments.map((segment) => (
            <path key={segment.label} d={segment.path} fill={segment.color}>
              <title>{`${segment.label}: ${formatValue(segment.value)} (${Math.round(segment.share * 100)}%)`}</title>
            </path>
          ))}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-[var(--font-display)] text-lg font-bold text-white">{centerValue}</span>
            {centerLabel ? <span className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">{centerLabel}</span> : null}
          </div>
        )}
      </div>

      <ul className="w-full min-w-0 space-y-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: segment.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[var(--color-ink)]" title={segment.label}>
              {segment.label}
            </span>
            <span className="shrink-0 text-xs text-[var(--color-muted)]">{Math.round(segment.share * 100)}%</span>
            <span className="w-20 shrink-0 text-right font-medium text-white">{formatValue(segment.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
