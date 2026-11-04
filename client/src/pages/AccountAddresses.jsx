import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import AccountShell from "../components/account/AccountShell";
import { accountApi } from "../api/customer";

const FIELD_CLASS =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-bright)] focus:ring-2 focus:ring-[var(--color-primary-bright)]/15";
const LABEL_CLASS = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]";
const BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60";

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function AddressForm({ initial, saving, error, onCancel, onSubmit }) {
  const [form, setForm] = useState(initial);
  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
      className="rounded-2xl border border-[var(--color-primary-bright)]/40 bg-[var(--color-surface)] p-4 sm:p-5"
      noValidate
    >
      <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">
        {initial._id ? "Edit address" : "New address"}
      </h2>

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="address-fullName" className={LABEL_CLASS}>Full name</label>
          <input
            id="address-fullName"
            className={FIELD_CLASS}
            value={form.fullName}
            onChange={update("fullName")}
            maxLength={100}
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label htmlFor="address-phone" className={LABEL_CLASS}>Phone</label>
          <input
            id="address-phone"
            type="tel"
            className={FIELD_CLASS}
            value={form.phone}
            onChange={update("phone")}
            placeholder="9876543210"
            maxLength={20}
            autoComplete="tel"
            required
          />
        </div>

        <div>
          <label htmlFor="address-pincode" className={LABEL_CLASS}>Pincode</label>
          <input
            id="address-pincode"
            className={FIELD_CLASS}
            value={form.pincode}
            onChange={update("pincode")}
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="postal-code"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address-line1" className={LABEL_CLASS}>Address line 1</label>
          <input
            id="address-line1"
            className={FIELD_CLASS}
            value={form.line1}
            onChange={update("line1")}
            placeholder="House no, building, street"
            maxLength={200}
            autoComplete="address-line1"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address-line2" className={LABEL_CLASS}>
            Address line 2 <span className="font-normal normal-case text-[var(--color-faint)]">(optional)</span>
          </label>
          <input
            id="address-line2"
            className={FIELD_CLASS}
            value={form.line2}
            onChange={update("line2")}
            placeholder="Area, landmark"
            maxLength={200}
            autoComplete="address-line2"
          />
        </div>

        <div>
          <label htmlFor="address-city" className={LABEL_CLASS}>City</label>
          <input
            id="address-city"
            className={FIELD_CLASS}
            value={form.city}
            onChange={update("city")}
            maxLength={60}
            autoComplete="address-level2"
            required
          />
        </div>

        <div>
          <label htmlFor="address-state" className={LABEL_CLASS}>State</label>
          <input
            id="address-state"
            className={FIELD_CLASS}
            value={form.state}
            onChange={update("state")}
            maxLength={60}
            autoComplete="address-level1"
            required
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-[var(--color-muted)] sm:col-span-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
            checked={Boolean(form.isDefault)}
            onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
          />
          Use as my default delivery address
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="submit" className={BUTTON_CLASS} disabled={saving}>
          {saving ? "Saving..." : initial._id ? "Save address" : "Add address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-6 text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AccountAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [max, setMax] = useState(10);
  const [status, setStatus] = useState("loading");
  const [listError, setListError] = useState("");
  const [panel, setPanel] = useState(null); // null = closed, "new" or the address being edited
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    document.title = "Saved addresses | CARTIVO";
  }, []);

  useEffect(() => {
    let active = true;
    accountApi
      .addresses()
      .then((response) => {
        if (!active) return;
        setAddresses(response.data || []);
        if (response.meta?.max) setMax(response.meta.max);
        setStatus("ready");
      })
      .catch((error) => {
        if (!active) return;
        setListError(error.message || "Your addresses could not be loaded.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  function applyResponse(response) {
    const saved = response.data;
    setAddresses((previous) => {
      const withoutSaved = previous.filter((address) => address._id !== saved._id);
      // a new default demotes the others locally too, matching the server
      const next = saved.isDefault
        ? withoutSaved.map((address) => ({ ...address, isDefault: false }))
        : withoutSaved;
      return [saved, ...next].sort(
        (a, b) => Number(b.isDefault) - Number(a.isDefault) || new Date(b.createdAt) - new Date(a.createdAt)
      );
    });
  }

  async function saveAddress(form) {
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      };
      if (form._id) {
        payload.isDefault = Boolean(form.isDefault);
        applyResponse(await accountApi.updateAddress(form._id, payload));
      } else {
        payload.isDefault = Boolean(form.isDefault);
        applyResponse(await accountApi.addAddress(payload));
      }
      setPanel(null);
    } catch (error) {
      setFormError(error.message || "The address could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(address) {
    setBusyId(address._id);
    setListError("");
    try {
      applyResponse(await accountApi.updateAddress(address._id, { isDefault: true }));
    } catch (error) {
      setListError(error.message || "The default address could not be changed.");
    } finally {
      setBusyId("");
    }
  }

  async function removeAddress(address) {
    if (!window.confirm("Delete this saved address?")) return;
    setBusyId(address._id);
    setListError("");
    try {
      await accountApi.removeAddress(address._id);
      setAddresses((previous) => {
        const next = previous.filter((item) => item._id !== address._id);
        // the server promotes a new default; mirror it so the list is never default-less
        if (address.isDefault && next.length > 0) next[0] = { ...next[0], isDefault: true };
        return next;
      });
      if (panel && panel._id === address._id) setPanel(null);
    } catch (error) {
      setListError(error.message || "The address could not be deleted.");
    } finally {
      setBusyId("");
    }
  }

  const atLimit = addresses.length >= max;

  return (
    <AccountShell
      title="Saved addresses"
      description={`Delivery details you can reuse at checkout. You can save up to ${max} addresses.`}
    >
      {listError ? (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {listError}
        </p>
      ) : null}

      {panel ? (
        <div className="mb-5">
          <AddressForm
            initial={panel === "new" ? EMPTY_ADDRESS : panel}
            saving={saving}
            error={formError}
            onCancel={() => {
              setPanel(null);
              setFormError("");
            }}
            onSubmit={saveAddress}
          />
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            />
          ))}
        </div>
      ) : null}

      {status === "ready" ? (
        <>
          {addresses.length === 0 && !panel ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
              <MapPin className="h-9 w-9 text-[var(--color-faint)]" aria-hidden="true" />
              <p className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">
                No saved addresses
              </p>
              <p className="max-w-md text-sm text-[var(--color-muted)]">
                Save an address here to keep your delivery details handy — you can still type a new
                address at checkout any time.
              </p>
              <button
                type="button"
                onClick={() => setPanel("new")}
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Add address
              </button>
            </div>
          ) : null}

          {addresses.length > 0 ? (
            <ul className="space-y-3">
              {addresses.map((address) => (
                <li
                  key={address._id}
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                        {address.fullName}
                        {address.isDefault ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                            <Star className="h-3 w-3" aria-hidden="true" /> Default
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        <br />
                        {address.city}, {address.state} {address.pincode}
                        <br />
                        {address.phone}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {!address.isDefault ? (
                        <button
                          type="button"
                          onClick={() => makeDefault(address)}
                          disabled={busyId === address._id}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)] disabled:opacity-60"
                        >
                          <Star className="h-3.5 w-3.5" aria-hidden="true" /> Set as default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setFormError("");
                          setPanel(address);
                        }}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAddress(address)}
                        disabled={busyId === address._id}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 text-xs font-semibold text-[var(--color-muted)] transition hover:border-rose-400 hover:text-rose-600 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {addresses.length > 0 && !panel ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setPanel("new")}
                disabled={atLimit}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Add another address
              </button>
              {atLimit ? (
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  You have reached the limit of {max} saved addresses. Delete one to add another.
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </AccountShell>
  );
}
