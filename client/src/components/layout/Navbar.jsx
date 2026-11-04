import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Moon, Sun } from "lucide-react";
import { getCategories } from "../../api/categories";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import BrandLogo from "../brand/BrandLogo";

// builds a parent -> children map out of the flat list the API returns
function groupByParent(categories) {
  const parents = categories.filter((c) => !c.parent);
  return parents.map((parent) => ({
    ...parent,
    children: categories.filter((c) => c.parent === parent._id),
  }));
}

export default function Navbar() {
  const [categories, setCategories] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef(null);
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { count: cartCount } = useCart();
  const { user, openAuth } = useAuth();
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(groupByParent(res.data)))
      .catch(() => setCategories([]));
  }, []);

  // the sticky navbar only needs its shadow once content moves underneath it
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  // the mobile drawer is a fixed overlay pinned under the header, so the page
  // needs to know the header's live height (it changes with the logo
  // breakpoint and whenever the search row opens)
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;
    const apply = () =>
      document.documentElement.style.setProperty("--cartivo-nav-h", `${header.offsetHeight}px`);
    apply();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // The mobile drawer covers the page, so stop the page behind it scrolling.
  // The lock goes on <html>, NOT <body>: locking the body makes the viewport
  // stop being a scrolling scrollport, which silently kills `position: sticky`
  // and the stuck header scrolls away with the page — taking the drawer, which
  // is pinned under it, off screen. Locking the root keeps the header pinned.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const root = document.documentElement;
    const previousOverflowY = root.style.overflowY;
    root.style.overflowY = "hidden";
    return () => {
      root.style.overflowY = previousOverflowY;
    };
  }, [mobileOpen]);

  // resizing from phone/tablet to desktop must not leave an open drawer or
  // hidden page scroll behind; both menus are desktop-hidden by CSS anyway
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event) => {
      if (!event.matches) return;
      setMobileOpen(false);
      setSearchOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate("/search?q=" + encodeURIComponent(searchValue.trim()));
    setMobileOpen(false);
    setSearchOpen(false);
  }

  function toggleMobileSearch() {
    setSearchOpen((v) => {
      const next = !v;
      if (next) window.requestAnimationFrame(() => searchInputRef.current?.focus());
      return next;
    });
    setMobileOpen(false);
  }

  return (
    <>
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 backdrop-blur transition-shadow ${scrolled ? "navbar-scrolled" : ""}`}
    >        {/* top bar: logo, search, account/wishlist/cart */}
        <div className="flex w-full items-center gap-2 py-2 px-2 sm:gap-3 sm:px-6 lg:px-8 xl:px-12">
        {/* hamburger (mobile): morphing bars, no icon swap */}
        <button
          type="button"
          className="hamburger flex flex-shrink-0 lg:hidden text-[var(--color-ink)] hover:text-[var(--color-primary)] transition-colors -mt-0.5"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => { setMobileOpen((v) => !v); setSearchOpen(false); }}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex min-w-0 shrink items-center py-0.5">
          <BrandLogo className="h-8 object-left sm:h-9 md:h-10 lg:h-11" />
        </Link>

        {/* Search bar – explicit search button on mobile, inline bar on desktop */}
        <button
          type="button"
          onClick={toggleMobileSearch}
          aria-label={searchOpen ? "Hide search" : "Search products"}
          aria-expanded={searchOpen}
          aria-controls="mobile-search"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface)] text-slate-700 transition hover:bg-sky-50 hover:text-[var(--color-primary-bright)] sm:ml-0 lg:hidden"
        >
          <Search className="h-5 w-5" />
        </button>
        <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 mx-6 lg:block max-w-5xl lg:mx-6">
          <div className="relative w-full">
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search products, brands and categories..."
              className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-5 text-sm outline-none transition focus:border-[var(--color-primary-bright)] focus:bg-white focus:shadow-md"
            />
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </form>

        {/* Right icons – one icon per action, sized for touch on mobile */}
        <nav className="ml-auto hidden shrink-0 items-center gap-1.5 sm:flex sm:gap-2.5" aria-label="Wishlist, cart and account">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            aria-pressed={theme === "dark"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="flex flex-col items-center gap-1 text-[10px] font-medium text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-bright)] focus-visible:ring-offset-2"
          >
            <span className="hidden text-[10px] font-semibold lg:inline">Appearance</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] transition sm:h-9 sm:w-9">
              {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </span>
          </button>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="group flex flex-col items-center gap-1 text-[10px] text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)]"
            title="Wishlist"
          >
            <span className="hidden text-[10px] font-semibold lg:inline">Wishlist</span>
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] transition group-hover:bg-sky-50 sm:h-9 sm:w-9">
              <Heart className="h-[18px] w-[18px] text-slate-700 transition group-hover:scale-110 group-hover:text-[var(--color-primary-bright)]" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white" aria-label={wishlistCount + " items in wishlist"}>
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </span>
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="group flex flex-col items-center gap-1 text-[10px] text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)]"
            title="Cart"
          >
            <span className="hidden text-[10px] font-semibold lg:inline">Cart</span>
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] transition group-hover:bg-sky-50 sm:h-9 sm:w-9">
              <ShoppingBag className="h-[18px] w-[18px] text-slate-700 transition group-hover:scale-110 group-hover:text-[var(--color-primary-bright)]" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white" aria-label={cartCount + " items in cart"}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
          </Link>

          {/* Account: opens auth modal when signed out, account page when signed in */}
          {user ? (
            <Link
              to="/account"
              className="group flex flex-col items-center gap-1 text-[10px] text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)]"
              title="Account"
            >
              <span className="hidden max-w-16 truncate text-[10px] font-semibold lg:inline">{user.name}</span>
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface)] transition group-hover:bg-sky-50">
                <User className="h-5 w-5 text-slate-700 transition group-hover:scale-110 group-hover:text-[var(--color-primary-bright)]" />
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuth(null, "login")}
              className="group flex flex-col items-center gap-1 text-[10px] text-[var(--color-ink)] transition hover:text-[var(--color-primary-bright)]"
              title="Sign in"
            >
              <span className="hidden text-[10px] font-semibold lg:inline">Sign in</span>
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface)] transition group-hover:bg-sky-50">
                <User className="h-5 w-5 text-slate-700 transition group-hover:scale-110 group-hover:text-[var(--color-primary-bright)]" />
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* category row with hover dropdowns, desktop only */}
      <div className="border-t border-[var(--color-border)] hidden lg:block">
        <div className="flex w-full items-center gap-7 px-4 sm:px-8 lg:px-12 xl:px-16 text-xs sm:text-sm">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="relative py-2"
              onMouseEnter={() => setOpenMenu(cat._id)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                to={`/category/${cat.slug}`}
                className="font-medium text-[var(--color-ink)] hover:text-[var(--color-primary)] transition"
              >
                {cat.name}
              </Link>
              {openMenu === cat._id && cat.children.length > 0 && (
                <div className="absolute left-0 top-full w-56 rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-lg">
                  {cat.children.map((child) => (
                    <Link
                      key={child._id}
                      to={`/category/${child.slug}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)]">
                        {child.name.charAt(0).toUpperCase()}
                      </span>
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* mobile search: always mounted so it can animate open/closed */}
      <div
        id="mobile-search"
        className={`nav-collapse grid lg:hidden ${searchOpen ? "nav-open" : ""}`}
      >
        <div>
          <form onSubmit={handleSearch} className="px-4 pb-3 pt-3">
            <div className="relative w-full">
              <input
                ref={searchInputRef}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search products, brands and categories..."
                tabIndex={searchOpen ? 0 : -1}
                className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-primary-bright)]"
              />
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </form>
        </div>
      </div>

      {/* mobile menu: fixed overlay under the header (not in the header flow,
          so opening it never pushes the page around); always mounted so it
          can animate in and out */}
      <div
        id="mobile-menu"
        className={`nav-overlay-panel bg-white/95 backdrop-blur border-b border-[var(--color-border)] lg:hidden ${mobileOpen ? "nav-open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <div>
          <nav
            className="border-t border-[var(--color-border)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            aria-label="Mobile menu"
          >
            <div className="flex flex-col">
              {/* On phones these actions live in the drawer so the header
                  keeps room for the logo and search. */}
              <div className="mb-1 grid grid-cols-2 gap-2 border-b border-[var(--color-border)]/60 pb-3 sm:hidden">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-pressed={theme === "dark"}
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-left text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-700">
                    {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  <span className="truncate">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                </button>

                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-700">
                    <Heart className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="truncate">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="ml-auto rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-700">
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="truncate">Cart</span>
                  {cartCount > 0 && (
                    <span className="ml-auto rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>

                {user ? (
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-700">
                      <User className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="truncate">Account</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); openAuth(null, "login"); }}
                    className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-left text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-700">
                      <User className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="truncate">Sign in</span>
                  </button>
                )}
              </div>

              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/category/${cat.slug}`}
                  className="border-b border-[var(--color-border)]/60 py-3 text-sm font-medium text-[var(--color-ink)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>

    {/* dimmed scrim over the whole page; clicking it closes the drawer. It
        sits outside the header so it covers the content below it, never the
        header itself. */}
    <div
      className={`nav-overlay-scrim lg:hidden ${mobileOpen ? "nav-open" : ""}`}
      onClick={() => setMobileOpen(false)}
      aria-hidden="true"
    />
    </>
  );
}
