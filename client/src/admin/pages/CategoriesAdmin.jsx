import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";

const FIELD_CLASS =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]";

const emptyForm = { name: "", parent: "", sortOrder: "0", active: true };

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const [editing, setEditing] = useState(null); // null = closed; {} = create
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get("/admin/categories");
    setCategories(res.data);
    setStatus("done");
  }, []);

  useEffect(() => {
    load().catch(() => setStatus("error"));
  }, [load]);

  const nameById = new Map(categories.map((c) => [c._id, c.name]));

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setEditing({});
  }

  function openEdit(category) {
    setForm({
      name: category.name || "",
      parent: category.parent || "",
      sortOrder: category.sortOrder ?? 0,
      active: category.active !== false,
    });
    setFormError("");
    setEditing(category);
  }

  function closeModal() {
    if (saving) return;
    setEditing(null);
    setFormError("");
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    if (!name) return setFormError("Category name is required.");
    if (editing?._id && form.parent === editing._id) return setFormError("A category cannot be its own parent.");

    const payload = {
      name,
      parent: form.parent || null,
      sortOrder: Number(form.sortOrder) || 0,
    };

    setSaving(true);
    try {
      if (editing?._id) {
        await api.patch(`/categories/${editing._id}`, { ...payload, active: form.active });
        setNotice("Category updated.");
      } else {
        await api.post("/categories", payload);
        setNotice("Category created.");
      }
      await load();
      setEditing(null);
    } catch (requestError) {
      setFormError(requestError.message || "Could not save the category.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category) {
    setBusyId(category._id);
    setNotice("");
    try {
      const next = category.active === false;
      await api.patch(`/categories/${category._id}`, { active: next });
      await load();
      setNotice(next ? "Category activated." : "Category deactivated.");
    } catch (requestError) {
      setNotice(requestError.message || "Could not change the category.");
    } finally {
      setBusyId("");
    }
  }

  async function removeCategory(category) {
    if (!window.confirm(`Delete "${category.name}"? It will be deactivated and hidden from the store.`)) return;
    setBusyId(category._id);
    setNotice("");
    try {
      await api.delete(`/categories/${category._id}`);
      await load();
      setNotice("Category deleted.");
    } catch (requestError) {
      setNotice(requestError.message || "Could not delete the category.");
    } finally {
      setBusyId("");
    }
  }

  // a category cannot be nested under itself or one of its own children
  const parentOptions = categories.filter((c) => c._id !== editing?._id && !c.parent);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Categories</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Create, reorder, nest and deactivate catalog categories.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          New category
        </button>
      </div>

      {notice && <p className="mt-4 text-sm text-[var(--color-primary-bright)]">{notice}</p>}
      {status === "loading" && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading...</p>}
      {status === "error" && <p className="mt-6 text-sm text-[var(--color-danger)]">Could not load categories.</p>}

      {status === "done" && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium text-white">
                    {c.parent ? <span className="text-[var(--color-faint)]">&#8627; </span> : null}
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{c.slug}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {c.parent ? nameById.get(c.parent) || "-" : <span className="text-[var(--color-faint)]">Top level</span>}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.active === false ? "INACTIVE" : "ACTIVE"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === c._id}
                        onClick={() => toggleActive(c)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)] disabled:opacity-50"
                      >
                        {c.active === false ? "Activate" : "Deactivate"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === c._id}
                        onClick={() => removeCategory(c)}
                        className="rounded-lg border border-[var(--color-danger)]/40 px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-muted)]">
                    No categories yet. Use "New category" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing?._id ? "Edit category" : "New category"}
        maxWidth="max-w-lg"
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : editing?._id ? "Save changes" : "Create category"}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="grid gap-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Name</span>
            <input className={FIELD_CLASS} value={form.name} onChange={(e) => setField("name", e.target.value)} required />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Parent category</span>
            <select className={FIELD_CLASS} value={form.parent} onChange={(e) => setField("parent", e.target.value)}>
              <option value="">None (top level)</option>
              {parentOptions.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Sort order</span>
            <input type="number" step="1" className={FIELD_CLASS} value={form.sortOrder} onChange={(e) => setField("sortOrder", e.target.value)} />
            <span className="mt-1 block text-xs text-[var(--color-muted)]">Lower numbers appear first.</span>
          </label>

          {editing?._id ? (
            <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
              <input type="checkbox" checked={form.active} onChange={(e) => setField("active", e.target.checked)} />
              Active (visible in the storefront)
            </label>
          ) : null}

          {formError && <p role="alert" className="text-sm text-[var(--color-danger)]">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
}
