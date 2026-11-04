const styles = {
  // product / category lifecycle
  ACTIVE: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  DRAFT: "bg-[var(--color-surface-soft)] text-[var(--color-muted)]",
  INACTIVE: "bg-[var(--color-surface-soft)] text-[var(--color-muted)]",

  // contact inquiries
  NEW: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  READ: "bg-sky-500/15 text-sky-400",
  IN_PROGRESS: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  RESOLVED: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  ARCHIVED: "bg-[var(--color-surface-soft)] text-[var(--color-muted)]",

  // order statuses
  IN_CHECKOUT: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  PLACED: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  CONFIRMED: "bg-sky-500/15 text-sky-400",
  PROCESSING: "bg-sky-500/15 text-sky-400",
  DISPATCHED: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  DELIVERED: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  CANCELLED: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
  FAILED: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",

  // payment statuses
  PENDING: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  PAID: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  REFUNDED: "bg-[var(--color-surface-soft)] text-[var(--color-muted)]",
};

export default function StatusBadge({ status }) {
  const cls = styles[status] || "bg-[var(--color-surface-soft)] text-[var(--color-muted)]";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{status}</span>;
}
