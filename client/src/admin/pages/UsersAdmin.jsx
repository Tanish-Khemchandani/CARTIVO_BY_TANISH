import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";
import BarList from "../components/charts/BarList";
import Pagination from "../components/ui/Pagination";
import { SummaryStrip, Toolbar } from "../components/ui/Toolbar";
import useDebouncedValue from "../hooks/useDebouncedValue";

const USER_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "spend-desc", label: "Highest spend" },
  { value: "orders-desc", label: "Most orders" },
];

const FIELD_CLASS =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]";

function money(value) {
  return `\u20b9${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "-";
}

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [ordersFilter, setOrdersFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [detailFor, setDetailFor] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20", sort });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filter) params.set("status", filter);
    if (ordersFilter) params.set("orders", ordersFilter);

    const res = await api.get(`/admin/users?${params.toString()}`);
    setUsers(res.data);
    setMeta(res.meta || null);
    setStatus("done");
  }, [debouncedSearch, filter, ordersFilter, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter, ordersFilter, sort]);

  useEffect(() => {
    setStatus("loading");
    load().catch(() => setStatus("error"));
  }, [load]);

  function resetFilters() {
    setSearch("");
    setFilter("");
    setOrdersFilter("");
    setSort("newest");
  }

  async function toggleStatus(user) {
    setBusyId(user._id);
    setNotice("");
    try {
      const next = user.status === "active" ? "inactive" : "active";
      await api.patch(`/admin/users/${user._id}`, { status: next });
      await load();
      setNotice(`${user.name} is now ${next}.`);
    } catch (requestError) {
      setNotice(requestError.message || "Could not update the customer.");
    } finally {
      setBusyId("");
    }
  }

  async function openDetail(user) {
    setDetailFor(user);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}`);
      setDetail(res.data);
    } catch {
      setDetail({ user, orders: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Users</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Every customer who has bought from the store, with their order history.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Toolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search by name, email or phone…"
          onReset={resetFilters}
          filters={[
            {
              name: "status",
              label: "Status",
              value: filter,
              onChange: setFilter,
              options: [
                { value: "", label: `All customers (${(meta?.active ?? 0) + (meta?.inactive ?? 0)})` },
                { value: "active", label: `Active (${meta?.active ?? 0})` },
                { value: "inactive", label: `Inactive (${meta?.inactive ?? 0})` },
              ],
            },
            {
              name: "orders",
              label: "Orders",
              value: ordersFilter,
              onChange: setOrdersFilter,
              options: [
                { value: "", label: "Any order history" },
                { value: "with", label: "Has orders" },
                { value: "without", label: "No orders yet" },
              ],
            },
            { name: "sort", label: "Sort", value: sort, onChange: setSort, options: USER_SORTS },
          ]}
        />
      </div>

      {meta ? (
        <SummaryStrip
          items={[
            { label: "Matching customers", value: meta.total, hint: `${meta.pages} page${meta.pages === 1 ? "" : "s"}` },
            { label: "Spent in view", value: money(meta.spent), hint: `${meta.orders} order${meta.orders === 1 ? "" : "s"}` },
            { label: "With orders", value: meta.withOrders },
            { label: "Without orders", value: Math.max(0, meta.total - meta.withOrders) },
          ]}
        />
      ) : null}

      {notice && <p className="mt-4 text-sm text-[var(--color-primary-bright)]">{notice}</p>}
      {status === "loading" && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading...</p>}
      {status === "error" && <p className="mt-6 text-sm text-[var(--color-danger)]">Could not load customers.</p>}

      {status === "done" && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total spent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{user.phone || "-"}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{user.orderCount}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{money(user.totalSpent)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status === "inactive" ? "INACTIVE" : "ACTIVE"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openDetail(user)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        disabled={busyId === user._id}
                        onClick={() => toggleStatus(user)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)] disabled:opacity-50"
                      >
                        {user.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-muted)]">
                    No customers match these filters yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination meta={meta} onPage={setPage} itemLabel="customers" />
        </div>
      )}

      {status === "done" && users.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Biggest spenders on this page
          </h2>
          <p className="mb-4 mt-1 text-xs text-[var(--color-muted)]">Spend across all their orders.</p>
          <BarList
            items={[...users]
              .sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0))
              .slice(0, 6)
              .map((user) => ({
                id: user._id,
                label: user.name,
                value: Number(user.totalSpent || 0),
                orders: `${user.orderCount} order${user.orderCount === 1 ? "" : "s"}`,
              }))}
            valueKey="value"
            secondaryKey="orders"
            formatValue={money}
            color="var(--color-accent)"
            emptyMessage="No spend recorded for these customers yet."
          />
        </section>
      ) : null}

      <Modal
        open={detailFor !== null}
        title={detailFor ? detailFor.name : "Customer"}
        onClose={() => setDetailFor(null)}
        footer={
          <button
            type="button"
            onClick={() => setDetailFor(null)}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
          >
            Close
          </button>
        }
      >
        {detailLoading && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}
        {!detailLoading && detail && (
          <div className="space-y-5 text-sm">
            <div className="grid gap-1 rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Customer</p>
              <p className="text-white">{detail.user?.name}</p>
              <p className="text-[var(--color-muted)]">{detail.user?.email}</p>
              {detail.user?.phone ? <p className="text-[var(--color-muted)]">{detail.user.phone}</p> : null}
              <p className="text-[var(--color-muted)]">Joined {formatDate(detail.user?.createdAt)}</p>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-[var(--color-muted)]">
                Orders ({(detail.orders || []).length})
              </p>
              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
                    <tr>
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.orders || []).map((order) => (
                      <tr key={order._id} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2 text-white">{order.orderNo}</td>
                        <td className="px-3 py-2 text-[var(--color-muted)]">{formatDate(order.createdAt)}</td>
                        <td className="px-3 py-2 text-[var(--color-muted)]">{money(order.total)}</td>
                        <td className="px-3 py-2"><StatusBadge status={order.status} /></td>
                      </tr>
                    ))}
                    {(detail.orders || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-5 text-center text-[var(--color-muted)]">
                          This customer has not placed an order yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
