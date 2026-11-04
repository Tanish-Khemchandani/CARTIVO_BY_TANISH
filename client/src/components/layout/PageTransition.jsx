import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import BrandLogo from "../brand/BrandLogo";

/*
 * Page transition + scroll management for the storefront.
 *
 * Every navigation: the page content fades in with a short rise
 * (.page-enter, in index.css), and the scroll snaps back to the top
 * like a traditional multi-page site. The jump runs under
 * `behavior: "instant"` while the canvas is still faded out, so the
 * reset itself is never visible.
 *
 * Only PUSH/REPLACE navigations reset scroll. Back/forward (POP) keeps
 * the browser's native history scroll restoration, per
 * useNavigationType() — performance getEntriesByType cannot detect SPA
 * back/forward, only the initial document load.
 *
 * Keying the wrapper by pathname gives React a fresh DOM node per route,
 * which is what makes the fade restart cleanly.
 */
export default function PageTransition() {
  const location = useLocation();
  const navType = useNavigationType();
  const firstRender = useRef(true);
  const [showRouteLoader, setShowRouteLoader] = useState(false);

  useEffect(() => {
    if (firstRender.current) {
      // initial load: never steal an existing scroll position (anchors, restore)
      firstRender.current = false;
      return;
    }
    setShowRouteLoader(true);
    const timer = window.setTimeout(() => setShowRouteLoader(false), 1050);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (location.state?.scrollTo === false) return;
    if (navType === "POP") return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.state, navType]);

  return (
    <>
      {showRouteLoader && (
        <div className="route-logo-loader" role="status" aria-label="Loading CARTIVO">
          <div className="route-logo-loader-card">
            <BrandLogo className="route-logo-loader-image" aria-hidden="true" />
            <span className="route-logo-loader-track" aria-hidden="true" />
          </div>
          <span className="sr-only">Loading CARTIVO</span>
        </div>
      )}
      <div className="page-enter min-h-full" key={location.pathname}>
        <Outlet />
      </div>
    </>
  );
}
