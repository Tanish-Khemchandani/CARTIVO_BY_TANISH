import { useEffect, useState } from "react";
import { api } from "../../api/client";

const FIELD_CLASS =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]";

const SOCIAL_FIELDS = [
  { key: "facebook", label: "Facebook URL" },
  { key: "instagram", label: "Instagram URL" },
  { key: "twitter", label: "X / Twitter URL" },
  { key: "youtube", label: "YouTube URL" },
];

export default function SettingsAdmin() {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/settings")
      .then((res) => {
        setForm({
          ...res.data,
          social: { ...res.data.social },
        });
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, []);

  function set(field, value) {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setSocial(key, value) {
    setSaved(false);
    setForm((current) => ({ ...current, social: { ...current.social, [key]: value } }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      // PATCH takes only editable fields; the form state also holds doc
    // metadata (_id, timestamps) that the server rejects
    const payload = {
      siteName: form.siteName,
      tagline: form.tagline,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      address: form.address,
      supportHours: form.supportHours,
      footerText: form.footerText,
      social: { ...form.social },
    };
    const res = await api.patch("/admin/settings", payload);
      setForm({ ...res.data, social: { ...res.data.social } });
      setSaved(true);
    } catch (requestError) {
      setError(requestError.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return <p className="text-sm text-[var(--color-muted)]">Loading settings...</p>;
  if (status === "error") return <p className="text-sm text-[var(--color-danger)]">Could not load settings.</p>;

  return (
    <div>
      <div>
        <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Website settings</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Store identity and contact details. Saving here updates what the storefront footer shows.
        </p>
      </div>

      <form onSubmit={handleSave} className="mt-6 grid max-w-3xl gap-6">
        <section className="rounded-2xl border border-[var(--color-border)] p-5">
          <h2 className="text-sm font-semibold text-white">Store identity</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Site name</span>
              <input className={FIELD_CLASS} value={form.siteName} onChange={(e) => set("siteName", e.target.value)} />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Tagline (footer description)</span>
              <textarea rows={2} className={FIELD_CLASS} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Footer text (bottom line)</span>
              <input className={FIELD_CLASS} value={form.footerText} onChange={(e) => set("footerText", e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] p-5">
          <h2 className="text-sm font-semibold text-white">Contact details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Support email</span>
              <input type="email" className={FIELD_CLASS} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Support phone</span>
              <input className={FIELD_CLASS} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Address</span>
              <input className={FIELD_CLASS} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Support hours</span>
              <input className={FIELD_CLASS} value={form.supportHours} onChange={(e) => set("supportHours", e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] p-5">
          <h2 className="text-sm font-semibold text-white">Social links</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Must start with http:// or https://, or stay empty.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((field) => (
              <label key={field.key} className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--color-ink)]">{field.label}</span>
                <input
                  type="url"
                  className={FIELD_CLASS}
                  value={form.social[field.key] || ""}
                  onChange={(e) => setSocial(field.key, e.target.value)}
                  placeholder="https://..."
                />
              </label>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
          {saved && <span className="text-sm text-[var(--color-success)]">Settings saved.</span>}
          {error && <span role="alert" className="text-sm text-[var(--color-danger)]">{error}</span>}
        </div>
      </form>
    </div>
  );
}
