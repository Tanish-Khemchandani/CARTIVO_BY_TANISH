import { useEffect, useRef } from "react";

// Accessible dialog used by the admin CRUD screens. Dark-theme styled like the
// rest of /admin, closes on Escape or backdrop click, and locks page scroll.
export default function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-2xl" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`w-full ${maxWidth} rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl outline-none`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="font-[var(--font-display)] text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg px-2 py-1 text-xl leading-none text-[var(--color-muted)] transition hover:bg-[var(--color-surface-soft)] hover:text-white"
          >
            &times;
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
