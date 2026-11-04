import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import Modal from "../components/ui/Modal";

const FIELD_CLASS =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]";

const ROLE_BADGE = {
  SUPER_ADMIN: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  ADMIN: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  MANAGER: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
};

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "-";
}

export default function AdminsAdmin() {
  const { admin: me } = useAdminAuth();
  const isSuperAdmin = me?.role === "SUPER_ADMIN";

  const [admins, setAdmins] = useState([]);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });
  const [creating, setCreating] = useState(false);

  // per-row edit state
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ name: "", password: "", role: "" });
  const [confirmTarget, setConfirmTarget] = useState(null);
  // password-reset modal (window.prompt is deliberately not used: it is
  // unavailable in embedded browsers and cannot validate input)
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get("/admin/admins");
    setAdmins(res.data);
    setStatus("done");
  }, []);

  useEffect(() => {
    load().catch(() => setStatus("error"));
  }, [load]);

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.post("/admin/admins", form);
      setForm({ name: "", email: "", password: "", role: "ADMIN" });
      setShowCreate(false);
      await load();
      setNotice(`Admin "${form.email}" created.`);
    } catch (requestError) {
      setError(requestError.message || "Could not create the admin.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(admin) {
    setEditingId(admin._id);
    setEditForm({ name: admin.name, password: "", role: admin.role });
    setNotice("");
    setError("");
  }

  async function saveEdit(admin) {
    setBusyId(admin._id);
    setError("");
    try {
      const payload = { name: editForm.name, role: editForm.role };
      if (editForm.password) payload.password = editForm.password;
      await api.patch(`/admin/admins/${admin._id}`, payload);
      setEditingId("");
      await load();
      setNotice(`${editForm.name} updated.`);
    } catch (requestError) {
      setError(requestError.message || "Could not update the admin.");
    } finally {
      setBusyId("");
    }
  }

  async function toggleActive(admin) {
    setBusyId(admin._id);
    setError("");
    try {
      await api.patch(`/admin/admins/${admin._id}`, { isActive: !admin.isActive });
      await load();
      setNotice(`${admin.name} ${admin.isActive ? "deactivated" : "activated"}.`);
    } catch (requestError) {
      setError(requestError.message || "Could not update the admin.");
    } finally {
      setBusyId("");
      setConfirmTarget(null);
    }
  }

  async function submitResetPassword() {
    if (!resetTarget || resetPasswordValue.length < 8) return;
    setResetting(true);
    setError("");
    try {
      await api.patch(`/admin/admins/${resetTarget._id}`, { password: resetPasswordValue });
      setNotice(`Password reset for ${resetTarget.email}. Their sessions were signed out.`);
      setResetTarget(null);
      setResetPasswordValue("");
    } catch (requestError) {
      setError(requestError.message || "Could not reset the password.");
    } finally {
      setResetting(false);
    }
  }

  if (status === "loading") {
    return <p className="mt-6 text-sm text-[var(--color-muted)]">Loading admins...</p>;
  }
  if (status === "error") {
    return <p className="mt-6 text-sm text-[var(--color-danger)]">Could not load admins.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Admins</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {isSuperAdmin
              ? "Create, edit and deactivate admin accounts."
              : "Only super admins can manage other admins."}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => { setShowCreate((v) => !v); setError(""); setNotice(""); }}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {showCreate ? "Cancel" : "+ Add admin"}
          </button>
        )}
      </div>

      {notice && <p className="mt-4 text-sm text-[var(--color-primary-bright)]">{notice}</p>}
      {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}

      {showCreate && isSuperAdmin && (
        <form
          onSubmit={handleCreate}
          className="mt-5 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-5 sm:grid-cols-2"
        >
          <label className="text-sm">
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-[var(--color-muted)]">Name</span>
            <input required className={`${FIELD_CLASS} w-full`} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-[var(--color-muted)]">Email</span>
            <input required type="email" autoComplete="off" className={`${FIELD_CLASS} w-full`} value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Password (min 8 chars)
            </span>
            <input required type="password" autoComplete="new-password" minLength={8}
              className={`${FIELD_CLASS} w-full`} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-[var(--color-muted)]">Role</span>
            <select className={`${FIELD_CLASS} w-full`} value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={creating}
              className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
              {creating ? "Creating..." : "Create admin"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last login</th>
              {isSuperAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => {
              const isSelf = me && admin.email === me.email;
              const editing = editingId === admin._id;
              return (
                <tr key={admin._id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    {editing ? (
                      <input className={`${FIELD_CLASS} w-full max-w-[220px]`} value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    ) : (
                      <>
                        <p className="font-medium text-white">
                          {admin.name}
                          {isSelf && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">you</span>}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">{admin.email}</p>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing ? (
                      <select className={`${FIELD_CLASS} w-full max-w-[160px]`} value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    ) : (
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[admin.role] || "border-[var(--color-border)] text-[var(--color-muted)]"}`}>
                        {admin.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${admin.isActive ? "text-emerald-400" : "text-[var(--color-danger)]"}`}>
                      {admin.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{formatDate(admin.lastLoginAt)}</td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      {editing ? (
                        <div className="flex justify-end gap-2">
                          <button type="button" disabled={busyId === admin._id} onClick={() => saveEdit(admin)}
                            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingId("")}
                            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]">
                            Cancel
                          </button>
                        </div>
                      ) : isSelf ? (
                        <p className="text-right text-xs text-[var(--color-muted)]">—</p>
                      ) : confirmTarget === admin._id ? (
                        <div className="flex justify-end gap-2">
                          <button type="button" disabled={busyId === admin._id} onClick={() => toggleActive(admin)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50 ${admin.isActive ? "bg-[var(--color-danger)]" : "bg-emerald-600"}`}>
                            {admin.isActive ? "Confirm deactivate" : "Confirm activate"}
                          </button>
                          <button type="button" onClick={() => setConfirmTarget(null)}
                            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(admin)}
                            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]">
                            Edit
                          </button>
                          <button type="button" onClick={() => setConfirmTarget(admin._id)}
                            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]">
                            {admin.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button type="button" disabled={busyId === admin._id} onClick={() => { setResetTarget(admin); setResetPasswordValue(""); }}
                            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)] disabled:opacity-50">
                            Reset password
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {admins.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 5 : 4} className="px-4 py-6 text-center text-[var(--color-muted)]">
                  No admin accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={resetTarget !== null}
        title={resetTarget ? `Reset password — ${resetTarget.name}` : "Reset password"}
        onClose={() => { setResetTarget(null); setResetPasswordValue(""); }}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => { setResetTarget(null); setResetPasswordValue(""); }}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={resetting || resetPasswordValue.length < 8}
              onClick={submitResetPassword}
              className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetting ? "Resetting..." : "Reset password"}
            </button>
          </>
        }
      >
        {resetTarget && (
          <form
            onSubmit={(e) => { e.preventDefault(); submitResetPassword(); }}
            className="space-y-4 text-sm"
          >
            <p className="text-[var(--color-muted)]">
              Setting a new password for <span className="text-white">{resetTarget.email}</span>. All their
              current sessions will be signed out immediately.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-[var(--color-muted)]">
                New password (min 8 characters)
              </span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                autoFocus
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                className={`${FIELD_CLASS} w-full`}
              />
            </label>
          </form>
        )}
      </Modal>
    </div>
  );
}
