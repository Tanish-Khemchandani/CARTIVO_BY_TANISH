import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // the mobile drawer should never stay open across a route change
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // while the drawer is open: lock page scroll and close on Escape
  useEffect(() => {
    if (!navOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setNavOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navOpen]);

  return (
    <div className="page-enter flex min-h-screen bg-[var(--color-bg)]" key={location.pathname}>
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
