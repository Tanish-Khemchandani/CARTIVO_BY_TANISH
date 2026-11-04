import { useEffect, useRef, useState } from "react";
import BrandLogo from "../brand/BrandLogo";

// Full-screen brand splash. `intro` plays once right after the demo gate is
// accepted; `loading` is the shorter version shown on the first hard load of a
// tab (once per session). Both use the original CARTIVO logo, revealed
// left-to-right like it is being written.
const EXIT_MS = 240;

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function SplashScreen({ mode = "intro", onDone }) {
  const [leaving, setLeaving] = useState(false);
  const reduced = useRef(prefersReducedMotion()).current;
  // Keep total on-screen time (including fade-out) under five seconds.
  const duration = reduced ? 600 : mode === "intro" ? 1800 : 1200;

  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflowY;
    root.style.overflowY = "hidden";

    const leaveTimer = window.setTimeout(() => setLeaving(true), duration);
    const doneTimer = window.setTimeout(() => doneRef.current?.(), duration + (reduced ? 160 : EXIT_MS));

    return () => {
      root.style.overflowY = previous;
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [duration, reduced]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading CARTIVO"
      className={`splash-screen ${leaving ? "splash-screen-leaving" : ""}`}
      style={{ "--splash-ms": `${duration}ms` }}
    >
      <span className="sr-only">Loading CARTIVO</span>

      <div className="splash-wordmark" aria-hidden="true">
        <BrandLogo className="splash-logo" />
        <span className="splash-caret" />
      </div>

      <p className="splash-tagline" aria-hidden="true">
        Shop smart <span aria-hidden="true">·</span> Live better
      </p>

      <div className="splash-progress" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
