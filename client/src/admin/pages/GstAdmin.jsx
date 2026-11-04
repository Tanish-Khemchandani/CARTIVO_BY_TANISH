import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import Modal from "../components/ui/Modal";

const FIELD_CLASS =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]";

function rateLabel(rule) {
  return `${rule.rate}%`;
}

function targetLabel(rule) {
  if (rule.scope === "category") return `${rule.category?.name || "Deleted category"} (category)`;
  return `${rule.product?.name || "Deleted product"} (product)`;
}

function effectiveLabel(rule) {
  if (!rule.effectiveFrom) return "Immediately";
  return new Date(rule.effectiveFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY_FORM = { name: "", rate: "", scope: "category", targetId: "", active: true, effectiveFrom: "" };

export default function GstAdmin() {
  const [rules, setRules] = useState([]);
  const [meta, setMeta] = useState({ active: 0, total: 0 });
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [editing, setEditing] = useState(null); // null | { ...form, _id? }
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    const res = await api.get("/admin/gst");
    const rows = res.data || [];
    setRules(rows);
    setMeta({
      active: rows.filter((rule) => rule.active).length,
      total: rows.length,
    });
    setStatus("done");
  }, []);

  useEffect(() => {
    load().catch(() => setStatus("error"));
    Promise.all([api.get("/admin/categories"), api.get("/admin/products")])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.data || []);
        setProducts(prodRes.data || []);
      })
      .catch(() => {});
  }, [load]);

  function openCreate() {
    setEditing({ ...EMPTY_FORM });
    setFormError("");
  }

  function openEdit(rule) {
    setEditing({
      _id: rule._id,
      name: rule.name,
      rate: String(rule.rate),
      scope: rule.scope,
      targetId: (rule.scope === "category" ? rule.category?._id : rule.product?._id) || "",
      active: rule.active,
      effectiveFrom: rule.effectiveFrom ? new Date(rule.effectiveFrom).toISOString().slice(0, 10) : "",
    });
    setFormError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setFormError("");

    const payload = {
      name: editing.name,
      rate: Number(editing.rate),
      scope: editing.scope,
      active: editing.active,
      category: editing.scope === "category" ? editing.targetId : null,
      product: editing.scope === "product" ? editing.targetId : null,
      effectiveFrom: editing.effectiveFrom || null,
    };

    if (!payload.name.trim()) return setFormError("Give the rule a name.");
    if (!Number.isFinite(payload.rate) || payload.rate < 0 || payload.rate > 100) return setFormError("Rate must be between 0 and 100.");
    if (!payload[editing.scope]) return setFormError(`Select a ${editing.scope} for the rule.`);

    setSaving(true);
    try {
      if (editing._id) {
        await api.patch(`/admin/gst/${editing._id}`, payload);
        setNotice(`Updated rule "${payload.name}".`);
      } else {
        await api.post("/admin/gst", payload);
        setNotice(`Created rule "${payload.name}".`);
      }
      await load();
      setEditing(null);
    } catch (requestError) {
      setFormError(requestError.message || "Could not save the rule.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rule) {
    try {
      await api.patch(`/admin/gst/${rule._id}`, { active: !rule.active });
      setNotice(`Rule "${rule.name}" is now ${rule.active ? "inactive" : "active"}.`);
      await load();
    } catch (requestError) {
      setNotice(requestError.message || "Could not change the rule.");
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/admin/gst/${deleting._id}`);
      setNotice(`Deleted rule "${deleting.name}".`);
      await load();
      setDeleting(null);
    } catch (requestError) {
      setNotice(requestError.message || "Could not delete the rule.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">GST manager</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Define the tax rate applied per category or per product. Checkout totals are calculated on the server.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Add GST rule
        </button>
      </div>

      {notice && <p className="mt-4 text-sm text-[var(--color-primary-bright)]">{notice}</p>}
      {status === "loading" && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading...</p>}
      {status === "error" && <p className="mt-6 text-sm text-[var(--color-danger)]">Could not load GST rules.</p>}

      {status === "done" && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Applies to</th>
                <th className="px-4 py-3">Effective</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule._id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium text-white">{rule.name}</td>
                  <td className="px-4 py-3 font-semibold text-white">{rateLabel(rule)}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{targetLabel(rule)}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{effectiveLabel(rule)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        rule.active
                          ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                          : "bg-[var(--color-muted)]/15 text-[var(--color-muted)]"
                      }`}
                    >
                      {rule.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(rule)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
                      >
                        {rule.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(rule)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(rule)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-muted)]">
                    No GST rules yet. Add one so checkout can calculate tax.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing?._id ? "Edit GST rule" : "Add GST rule"}
        maxWidth="max-w-lg"
        onClose={() => (saving ? null : setEditing(null))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="gst-form"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save rule"}
            </button>
          </>
        }
      >
        {editing && (
          <form id="gst-form" onSubmit={handleSave} className="grid gap-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Rule name</span>
              <input
                className={FIELD_CLASS}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Electronics 18% GST"
                autoFocus
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Rate (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={FIELD_CLASS}
                  value={editing.rate}
                  onChange={(e) => setEditing({ ...editing, rate: e.target.value })}
                  placeholder="18"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Applies to</span>
                <select
                  className={FIELD_CLASS}
                  value={editing.scope}
                  onChange={(e) => setEditing({ ...editing, scope: e.target.value, targetId: "" })}
                >
                  <option value="category">A whole category</option>
                  <option value="product">A single product</option>
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">
                {editing.scope === "category" ? "Category" : "Product"}
              </span>
              <select
                className={FIELD_CLASS}
                value={editing.targetId}
                onChange={(e) => setEditing({ ...editing, targetId: e.target.value })}
              >
                <option value="">Select...</option>
                {editing.scope === "category"
                  ? categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.parent ? `— ${category.name}` : category.name}
                      </option>
                    ))
                  : products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Effective from</span>
                <input
                  type="date"
                  className={FIELD_CLASS}
                  value={editing.effectiveFrom}
                  onChange={(e) => setEditing({ ...editing, effectiveFrom: e.target.value })}
                />
                <span className="mt-1 block text-xs text-[var(--color-muted)]">Leave empty for immediately.</span>
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm text-[var(--color-ink)]">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                />
                Rule is active
              </label>
            </div>

            {formError && <p role="alert" className="text-sm text-[var(--color-danger)]">{formError}</p>}
          </form>
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        title="Delete GST rule"
        maxWidth="max-w-md"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Delete rule
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-ink)]">
          Delete <span className="font-semibold">{deleting?.name}</span> ({deleting ? `${rateLabel(deleting)} on ${targetLabel(deleting)}` : ""})?
          Future totals will no longer include this rate.
        </p>
      </Modal>
    </div>
  );
}
