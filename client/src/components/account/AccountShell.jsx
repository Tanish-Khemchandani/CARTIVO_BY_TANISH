import { NavLink } from "react-router-dom";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/*
 * Shared frame for every /account page: session guard, heading and the tab
 * strip. Pages only render their own content, so the signed-out prompt and
 * the navigation cannot drift apart between them.
 */
const TABS = [
  { to: "/account", label: "Overview", end: true },
  { to: "/account/orders", label: "Orders" },
  { to: "/account/profile", label: "Profile" },
  { to: "/account/addresses", label: "Addresses" },
  { to: "/wishlist", label: "Wishlist" },
];

export default function AccountShell({ eyebrow = "Your account", title, description, children }) {
  const { user, loading, openAuth, logout } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto px-6 py-24 text-center text-sm text-[var(--color-muted)]">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 py-24 text-center">
        <UserIcon className="h-10 w-10 text-[var(--color-faint)]" aria-hidden="true" />
        <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
          My account
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Sign in to see your profile, orders and saved addresses.
        </p>
        <button
          type="button"
          onClick={() => openAuth(null, "login")}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary-bright)]">
        {eyebrow}
      </p>
      <h1 className="mt-1 font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      ) : null}

      <nav aria-label="Account sections" className="mt-5 border-b border-[var(--color-border)]">
        <ul className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <li key={tab.to} className="shrink-0">
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  "inline-flex whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-semibold transition " +
                  (isActive
                    ? "border-[var(--color-primary-bright)] text-[var(--color-primary-bright)]"
                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]")
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6">{children}</div>

      <button
        type="button"
        onClick={logout}
        className="mt-10 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-muted)] transition hover:border-rose-400 hover:text-rose-600"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
      </button>
    </div>
  );
}
