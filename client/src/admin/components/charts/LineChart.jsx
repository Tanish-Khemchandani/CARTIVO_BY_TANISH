/*
 * Area + line chart for a single series (new customers per bucket, order
 * counts). Drawn in a 0-100 box and stretched, so it fills whatever column
 * it is given; the stroke keeps its width thanks to non-scaling-stroke.
 */
export default function LineChart({
  points = [],
  valueKey = "value",
  formatValue = (value) => String(value),
  height = 160,
  color = "var(--color-accent)",
  emptyMessage = "No data in this range yet.",
}) {
  const values = points.map((point) => Number(point[valueKey] || 0));
  const max = Math.max(...values, 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  const labelEvery = points.length > 12 ? Math.ceil(points.length / 6) : 1;

  if (points.length === 0 || max === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted)]">
        {emptyMessage}
      </p>
    );
  }

  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 100 - (Number(point[valueKey] || 0) / max) * 92 - 4;
    return { x, y, point };
  });

  const line = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `0,100 ${line} 100,100`;

  return (
    <div>
      <div className="relative" style={{ height }}>
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={points
            .map((point) => `${point.fullLabel || point.label}: ${formatValue(point[valueKey])}`)
            .join(", ")}
        >
          <polygon points={area} fill={color} fillOpacity="0.14" />
          <polyline
            points={line}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* dots as separate elements so they stay round despite the stretch */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {coordinates.map(({ x, y, point }, index) => (
            <span
              key={point.key || point.label || index}
              className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-surface)]"
              style={{ left: `${x}%`, top: `${y}%`, background: color }}
              title={`${point.fullLabel || point.label}: ${formatValue(point[valueKey])}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex gap-1">
        {points.map((point, index) => (
          <span
            key={point.key || point.label || index}
            className="min-w-0 flex-1 truncate text-center text-[10px] text-[var(--color-muted)]"
          >
            {index % labelEvery === 0 || points.length <= 12 ? point.label : ""}
          </span>
        ))}
      </div>

      <p className="mt-2 text-xs text-[var(--color-muted)]">
        {formatValue(total)} in total · peak {formatValue(max)}
      </p>
    </div>
  );
}
