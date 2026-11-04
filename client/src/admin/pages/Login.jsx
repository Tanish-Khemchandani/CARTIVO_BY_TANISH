import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Eye, EyeOff } from "lucide-react";
import { FlaskConical, LayoutDashboard, Package, ShoppingBag, Users } from "lucide-react";

export default function AdminLogin() {
  const { admin, loading, login } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const destination = location.state?.from?.pathname || "/admin";

  if (!loading && admin) return <Navigate to={destination} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-enter flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-2">
      <section className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-xl sm:p-9">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">CARTIVO</p>
          <h1 className="mt-3 text-2xl font-bold text-[var(--color-ink)]">Admin sign in</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Sign in to manage the store dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Password</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-faint)] transition hover:text-[var(--color-ink)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || submitting}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
      <aside className="w-full rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-surface)] p-7 shadow-xl sm:p-9" aria-labelledby="demo-manager-title">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Portfolio demo
        </span>
        <h2 id="demo-manager-title" className="mt-4 text-xl font-bold text-[var(--color-ink)]">Explore the admin panel</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Use the read-only demo manager account to browse the dashboard and see how the store is managed. Changes are disabled.</p>
        <div className="mt-5 space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 font-mono text-sm">
          <p><span className="font-sans text-[var(--color-faint)]">Manager ID</span><br /><span className="select-all text-[var(--color-ink)]">demo.manager@cartivo.local</span></p>
          <p className="pt-2"><span className="font-sans text-[var(--color-faint)]">Password</span><br /><span className="select-all text-[var(--color-ink)]">CartivoDemo2026!</span></p>
        </div>
        <h3 className="mt-6 text-sm font-bold text-[var(--color-ink)]">What you can explore</h3>
        <ul className="mt-3 space-y-3 text-sm text-[var(--color-muted)]">
          {[
            [LayoutDashboard, "Dashboard metrics and store activity"],
            [Package, "Products, categories, inventory and GST rules"],
            [ShoppingBag, "Orders, reviews and contact inquiries"],
            [Users, "Customer and admin management screens"],
          ].map(([Icon, label]) => <li key={label} className="flex items-center gap-2.5"><Icon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />{label}</li>)}
        </ul>
        <p className="mt-5 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">Demo access is read-only. Please don’t enter real personal information; this site uses sample data.</p>
      </aside>
      </div>
    </main>
  );
}
