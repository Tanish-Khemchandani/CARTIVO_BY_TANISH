import { useEffect, useRef, useState } from "react";
import { X, Eye, EyeOff, Loader2, Check, CircleAlert } from "lucide-react";
import { authApi } from "../../api/customer";

/*
 * Login / sign-up overlay. Opens over whatever page the customer is on
 * when they hit a signed-in-only action (wishlist heart, account button).
 * Returns to that page and runs the pending action on success — no
 * redirect-away, so context is never lost.
 *
 * Both views stay mounted in a .auth-card-swap grid, so switching tabs
 * cross-fades and slides the cards while the panel height morphs; the
 * inactive view's inputs are disabled so hidden "required" fields can
 * never block submission and keyboard focus can't fall into hidden UI.
 */
export default function AuthModal({ open, mode = "login", onClose, onAuthenticated }) {
  const [tab, setTab] = useState(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const loginFirstRef = useRef(null);
  const signupFirstRef = useRef(null);

  // switch tabs when the mode prop changes (e.g., re-opened from wishlist)
  useEffect(() => {
    if (open) setTab(mode);
  }, [open, mode]);

  // reset secrets when the modal closes; focus the first empty field when
  // it opens or when the user flips tabs
  useEffect(() => {
    if (!open) {
      setError("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setSubmitting(false);
      return;
    }
    setError("");
    const targetRef = tab === "signup" ? signupFirstRef : loginFirstRef;
    // next frame so the freshly-visible view is mounted first
    window.requestAnimationFrame(() => targetRef.current?.focus());
  }, [open, tab]);

  // Escape closes the modal
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function switchTab(next) {
    setTab(next);
    setError("");
    setShowPassword(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (tab === "signup") {
      if (name.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const response =
        tab === "signup"
          ? await authApi.register({ name: name.trim(), email: email.trim(), password })
          : await authApi.login({ email: email.trim(), password });
      await onAuthenticated(response.data);
    } catch (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-bright)] focus:bg-white focus:shadow-md";
  const labelClass = "text-xs font-semibold text-[var(--color-ink)]";

  return (
    <div
      className="auth-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 py-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tab === "signup" ? "Create your account" : "Sign in to your account"}
        className="auth-panel relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-[var(--color-border)] bg-white shadow-2xl"
      >
        {/* brand gradient bar: navy -> bright blue -> cyan, straight off the logo palette */}
        <div
          aria-hidden="true"
          className="h-1.5 w-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-bright)] to-[var(--color-accent)]"
        />

        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign-in dialog"
            className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-faint)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
          >
            <X className="h-5 w-5" />
          </button>

          {/* sliding-pill tab switcher, styled like the storefront pills */}
          <div
            className="hfx-nav-sliding-pill"
            data-count="2"
            style={{ "--hfx-active": tab === "signup" ? 1 : 0 }}
            role="tablist"
            aria-label="Sign in or create an account"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "login"}
              aria-pressed={tab === "login"}
              onClick={() => switchTab("login")}
              className="text-sm font-semibold"
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "signup"}
              aria-pressed={tab === "signup"}
              onClick={() => switchTab("signup")}
              className="text-sm font-semibold"
            >
              Create account
            </button>
          </div>

          {/* both views mounted; .auth-card-swap animates the cross-fade */}
          <div className="auth-card-swap mt-6">
            {/*
              Sign-in view
            */}
            <div aria-hidden={tab !== "login"}>
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Sign in to save products and view your orders.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
                <div>
                  <label htmlFor="auth-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="auth-email"
                    ref={loginFirstRef}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    disabled={tab !== "login"}
                    required
                    maxLength={254}
                    className={"mt-1.5 " + inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className={labelClass}>
                    Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      disabled={tab !== "login"}
                      required
                      maxLength={128}
                      className={inputClass + " pr-11"}
                    />
                    <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                  </div>
                </div>

                <SubmitButton submitting={submitting} label="Sign in" />

                <p className="text-center text-xs text-[var(--color-muted)]">
                  New to CARTIVO?{" "}
                  <button
                    type="button"
                    onClick={() => switchTab("signup")}
                    className="font-semibold text-[var(--color-primary-bright)] hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </form>
            </div>

            {/*
              Sign-up view
            */}
            <div aria-hidden={tab !== "signup"}>
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
                Create your account
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Save products, track orders and check out faster.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
                <div>
                  <label htmlFor="auth-name" className={labelClass}>
                    Full name
                  </label>
                  <input
                    id="auth-name"
                    ref={signupFirstRef}
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    disabled={tab !== "signup"}
                    required
                    maxLength={80}
                    className={"mt-1.5 " + inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="auth-signup-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="auth-signup-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    disabled={tab !== "signup"}
                    required
                    maxLength={254}
                    className={"mt-1.5 " + inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="auth-signup-password" className={labelClass}>
                    Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="auth-signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      disabled={tab !== "signup"}
                      required
                      minLength={8}
                      maxLength={128}
                      className={inputClass + " pr-11"}
                    />
                    <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[var(--color-faint)]">At least 8 characters.</p>
                </div>

                <div>
                  <label htmlFor="auth-confirm" className={labelClass}>
                    Confirm password
                  </label>
                  <input
                    id="auth-confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={tab !== "signup"}
                    required
                    minLength={8}
                    maxLength={128}
                    className={"mt-1.5 " + inputClass}
                  />
                </div>

                <SubmitButton submitting={submitting} label="Create account" />

                <p className="text-center text-xs text-[var(--color-muted)]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchTab("login")}
                    className="font-semibold text-[var(--color-primary-bright)] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PasswordToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-faint)] transition hover:text-[var(--color-ink)]"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function SubmitButton({ submitting, label }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)] disabled:opacity-60"
    >
      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" aria-hidden="true" />}
      {label}
    </button>
  );
}
