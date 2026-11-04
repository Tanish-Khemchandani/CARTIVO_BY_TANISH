import { ChevronLeft, ChevronRight } from "lucide-react";

const BUTTON_CLASS =
  "inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)] disabled:cursor-not-allowed disabled:opacity-50";

// Renders nothing when everything already fits on one page.
export default function Pagination({ meta, onPage, itemLabel = "items" }) {
  if (!meta || meta.pages <= 1) return null;

  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <p className="text-xs text-[var(--color-muted)]">
        Showing {from}–{to} of {meta.total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPage(meta.page - 1)} disabled={!meta.hasPrev} className={BUTTON_CLASS}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Prev
        </button>
        <span className="text-xs text-[var(--color-muted)]">
          Page {meta.page} / {meta.pages}
        </span>
        <button type="button" onClick={() => onPage(meta.page + 1)} disabled={!meta.hasNext} className={BUTTON_CLASS}>
          Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
