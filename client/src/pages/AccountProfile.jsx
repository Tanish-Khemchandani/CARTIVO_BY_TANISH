import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import AccountShell from "../components/account/AccountShell";
import { useAuth } from "../context/AuthContext";
import { accountApi } from "../api/customer";

const FIELD_CLASS =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-bright)] focus:ring-2 focus:ring-[var(--color-primary-bright)]/15 disabled:bg-[var(--color-surface)] disabled:text-[var(--color-muted)]";
const LABEL_CLASS = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]";
const BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60";

function Notice({ tone, children }) {
  if (!children) return null;
  const classes =
    tone === "error"
      ? "bg-rose-50 text-rose-700"
      : "bg-emerald-50 text-emerald-700";
  return (
    <p role="status" className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${classes}`}>
      {tone !== "error" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      <span>{children}</span>
    </p>
  );
}

export default function AccountProfile() {
  const { user, refresh } = useAuth();
  const [details, setDetails] = useState({ name: "", phone: "" });
  const [detailsState, setDetailsState] = useState({ saving: false, error: "", done: "" });

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordState, setPasswordState] = useState({ saving: false, error: "", done: "" });

  useEffect(() => {
    document.title = "Profile | CARTIVO";
  }, []);

  // the session check in AuthContext may still be in flight on first paint
  useEffect(() => {
    if (user) setDetails({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  async function saveDetails(event) {
    event.preventDefault();
    setDetailsState({ saving: true, error: "", done: "" });
    try {
      const response = await accountApi.updateProfile({
        name: details.name,
        phone: details.phone,
      });
      await refresh();
      setDetailsState({
        saving: false,
        error: "",
        done: `Saved. ${response.data?.name}${response.data?.phone ? ` · ${response.data.phone}` : ""}`,
      });
    } catch (error) {
      setDetailsState({ saving: false, error: error.message || "Your details could not be saved.", done: "" });
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordState({ saving: false, error: "The new passwords do not match.", done: "" });
      return;
    }
    setPasswordState({ saving: true, error: "", done: "" });
    try {
      await accountApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordState({ saving: false, error: "", done: "Password updated. Other devices were signed out." });
    } catch (error) {
      setPasswordState({ saving: false, error: error.message || "Your password could not be changed.", done: "" });
    }
  }

  return (
    <AccountShell
      title="Profile"
      description="Your name and phone appear on orders and delivery updates. Your email is the sign-in address."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="details-heading"
          className="rounded-2xl border border-[var(--color-border)] bg-white p-5"
        >
          <h2 id="details-heading" className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">
            Your details
          </h2>
          <form onSubmit={saveDetails} className="mt-4 grid gap-4" noValidate>
            <div>
              <label htmlFor="profile-name" className={LABEL_CLASS}>Full name</label>
              <input
                id="profile-name"
                className={FIELD_CLASS}
                value={details.name}
                onChange={(event) => setDetails((prev) => ({ ...prev, name: event.target.value }))}
                maxLength={80}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="profile-email" className={LABEL_CLASS}>Email</label>
              <input id="profile-email" className={FIELD_CLASS} value={user?.email || ""} disabled readOnly />
              <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                Contact support if you need to change the email on your account.
              </p>
            </div>

            <div>
              <label htmlFor="profile-phone" className={LABEL_CLASS}>Phone</label>
              <input
                id="profile-phone"
                type="tel"
                className={FIELD_CLASS}
                value={details.phone}
                onChange={(event) => setDetails((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="9876543210"
                maxLength={20}
                autoComplete="tel"
              />
              <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                Optional, but it lets your order history line up with checkout.
              </p>
            </div>

            <Notice tone={detailsState.error ? "error" : "success"}>
              {detailsState.error || detailsState.done}
            </Notice>

            <div>
              <button type="submit" className={BUTTON_CLASS} disabled={detailsState.saving}>
                {detailsState.saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        <section
          aria-labelledby="password-heading"
          className="rounded-2xl border border-[var(--color-border)] bg-white p-5"
        >
          <h2 id="password-heading" className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">
            Password
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Enter your current password, then choose a new one of at least 8 characters.
          </p>
          <form onSubmit={savePassword} className="mt-4 grid gap-4" noValidate>
            <div>
              <label htmlFor="current-password" className={LABEL_CLASS}>Current password</label>
              <input
                id="current-password"
                type="password"
                className={FIELD_CLASS}
                value={passwords.currentPassword}
                onChange={(event) => setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))}
                autoComplete="current-password"
                maxLength={128}
                required
              />
            </div>

            <div>
              <label htmlFor="new-password" className={LABEL_CLASS}>New password</label>
              <input
                id="new-password"
                type="password"
                className={FIELD_CLASS}
                value={passwords.newPassword}
                onChange={(event) => setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))}
                autoComplete="new-password"
                maxLength={128}
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className={LABEL_CLASS}>Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                className={FIELD_CLASS}
                value={passwords.confirmPassword}
                onChange={(event) => setPasswords((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                autoComplete="new-password"
                maxLength={128}
                required
              />
            </div>

            <Notice tone={passwordState.error ? "error" : "success"}>
              {passwordState.error || passwordState.done}
            </Notice>

            <div>
              <button type="submit" className={BUTTON_CLASS} disabled={passwordState.saving}>
                {passwordState.saving ? "Updating..." : "Change password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AccountShell>
  );
}
