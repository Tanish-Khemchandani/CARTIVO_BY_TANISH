import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function Header({ onMenu }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/admin/login", { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6 sm:py-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)] lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <p className="min-w-0 flex-1 truncate text-sm text-[var(--color-muted)]">
        Welcome back, {admin?.email}
      </p>

      <button
        type="button"
        onClick={handleLogout}
        className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
      >
        Sign out
      </button>
    </header>
  );
}
