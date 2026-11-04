import { Search, X } from "lucide-react";

/*
 * One filter row for every admin panel: a debounced search box, any number
 * of select filters, and a summary line that says what the current filter
 * produced. Pages own the state; this only renders it.
 */
export const CONTROL_CLASS =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-bright)]";

export function Toolbar({ search, onSearch, searchPlaceholder = "Search…", filters = [], onReset, children }) {
  const hasFilters = Boolean(search) || filters.some((filter) => filter.value);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
      <label className="relative min-w-0 flex-1 sm:min-w-[16rem]">
        <span className="sr-only">{searchPlaceholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className={`${CONTROL_CLASS} w-full pl-9`}
        />
      </label>

      {filters.map((filter) => (
        <label key={filter.name} className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="sr-only sm:not-sr-only sm:shrink-0">{filter.label}</span>
          <select
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            className={CONTROL_CLASS}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {children}

      {onReset && hasFilters ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
        </button>
      ) : null}
    </div>
  );
}

export function SummaryStrip({ items = [] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
        >
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">{item.label}</p>
          <p className={`mt-0.5 font-[var(--font-display)] text-lg font-bold ${item.tone === "danger" ? "text-[var(--color-danger)]" : item.tone === "warning" ? "text-[var(--color-warning)]" : "text-white"}`}>
            {item.value}
          </p>
          {item.hint ? <p className="text-[11px] text-[var(--color-muted)]">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
