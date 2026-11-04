import { useEffect, useRef, useState } from "react";
import { Check, FlaskConical, ShieldCheck } from "lucide-react";

// One-time "this is a demo" gate for the storefront. The accepted flag lives
// in localStorage, so a returning visitor goes straight to the store while a
// first-time visitor cannot interact with the site until they confirm.
export const DEMO_NOTICE_KEY = "cartivo:demo-notice:v1";

const POINTS = [
  "Every product, photo, price, rating and order here is sample data.",
  "Cash on Delivery checkout is simulated — no payment is ever collected.",
  "Orders you place are only stored so the admin dashboard has real data to show.",
];

export default function DemoNoticeGate({ onAccepted }) {
  // Decided during the first render, not in an effect, so a first-time
  // visitor never sees a frame of the store before the gate covers it.
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(DEMO_NOTICE_KEY) !== "accepted";
    } catch {
      // storage can be blocked; treat it as a first visit and show the gate
      return true;
    }
  });
  const [accepted, setAccepted] = useState(false);
  const checkboxRef = useRef(null);

  // Lock the page while the gate is up. The lock goes on <html> so the
  // sticky navbar keeps working, same as the mobile menu.
  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    const previous = root.style.overflowY;
    root.style.overflowY = "hidden";
    const timer = window.setTimeout(() => checkboxRef.current?.focus(), 80);
    return () => {
      root.style.overflowY = previous;
      window.clearTimeout(timer);
    };
  }, [open]);

  function handleContinue() {
    if (!accepted) return;
    try {
      window.localStorage.setItem(DEMO_NOTICE_KEY, "accepted");
    } catch {
      // if storage is unavailable the gate still closes for this visit
    }
    setOpen(false);
    onAccepted?.();
  }

  if (!open) return null;

  return (
    <div className="demo-gate-backdrop fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/75 px-4 py-[6vh] backdrop-blur-sm sm:items-center sm:py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-gate-title"
        aria-describedby="demo-gate-summary"
        className="demo-gate-panel w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-ink)] shadow-2xl sm:p-8"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          Demo storefront
        </span>

        <h2
          id="demo-gate-title"
          className="mt-4 font-[var(--font-display)] text-3xl font-bold leading-tight sm:text-4xl"
        >
          This is not a real brand.
        </h2>

        <p id="demo-gate-summary" className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          CARTIVO was built for skill demonstration purposes only. It exists to show how a complete
          storefront, checkout flow and admin dashboard are put together — not to sell anything.
        </p>

        <ul className="mt-5 space-y-2.5 text-sm leading-6 text-[var(--color-muted)]">
          {POINTS.map((point) => (
            <li key={point} className="flex gap-2.5">
              <Check
                className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] p-4">
          <label
            htmlFor="demo-gate-checkbox"
            className="flex cursor-pointer items-start gap-3 text-sm font-medium text-[var(--color-ink)]"
          >
            <input
              ref={checkboxRef}
              id="demo-gate-checkbox"
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-primary)]"
            />
            <span>I understood everything</span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!accepted}
          aria-disabled={!accepted}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Continue to the store
        </button>

        <p className="mt-3 text-center text-[11px] text-[var(--color-faint)]">
          Shown once on this browser. Tick the box to unlock the store.
        </p>
      </section>
    </div>
  );
}
