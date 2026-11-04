import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/admins", label: "Admins" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/contact-inquiries", label: "Contact inquiries" },
  { to: "/admin/gst", label: "GST manager" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/reviews", label: "Product review" },
  { to: "/admin/settings", label: "Website settings" },
  { to: "/admin/exports", label: "Exports" },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* backdrop only exists on small screens */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-sm">
            <img src="/assets/brand/cartivo-logo-light.png" alt="CARTIVO" width={800} height={208} className="h-6 w-auto max-w-full object-contain" />
            <span className="ml-auto rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-soft)] hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 pb-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
