import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";
import BarList from "../components/charts/BarList";
import Pagination from "../components/ui/Pagination";
import { SummaryStrip, Toolbar } from "../components/ui/Toolbar";
import useDebouncedValue from "../hooks/useDebouncedValue";

const ORDER_STATUSES = [
  "IN_CHECKOUT",
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
];

const STATUS_LABELS = {
  IN_CHECKOUT: "In checkout",
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  DISPATCHED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "value-desc", label: "Highest value" },
  { value: "value-asc", label: "Lowest value" },
];

const FIELD_CLASS =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]";

function money(value) {
  return `\u20b9${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20", sort });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await api.get(`/orders?${params.toString()}`);
    setOrders(res.data);
    setMeta(res.meta);
    setStatus("done");
  }, [debouncedSearch, statusFilter, sort, from, to, page]);

  // any filter change starts a new result set, so go back to the first page
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sort, from, to]);

  useEffect(() => {
    setStatus("loading");
    load().catch(() => setStatus("error"));
  }, [load]);

  async function changeStatus(order, nextStatus) {
    if (!nextStatus || nextStatus === order.status) return;
    setSavingStatus(true);
    setNotice("");
    try {
      const res = await api.patch(`/orders/${order._id}/status`, { status: nextStatus });
      setNotice(`Order ${order.orderNo} moved to ${nextStatus}.`);
      // the response is the raw order (customer is not populated), so merge
      // only the changed field to keep the populated row intact
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: res.data.status } : o)));
      setSelected((prev) => (prev && prev._id === order._id ? { ...prev, status: res.data.status } : prev));
      load().catch(() => {});
    } catch (requestError) {
      setNotice(requestError.message || "Could not update the order status.");
    } finally {
      setSavingStatus(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setSort("newest");
    setFrom("");
    setTo("");
  }

  const statusCounts = meta?.statusCounts || {};
  const chartRows = (meta?.statuses || ORDER_STATUSES)
    .filter((orderStatus) => statusCounts[orderStatus] > 0)
    .map((orderStatus) => ({
      id: orderStatus,
      label: STATUS_LABELS[orderStatus] || orderStatus,
      value: statusCounts[orderStatus],
    }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Orders</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Review orders, inspect line items and move each order through its lifecycle.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Toolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Order number, name, email, phone or city…"
          onReset={resetFilters}
          filters={[
            {
              name: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "", label: `All statuses (${meta?.total ?? 0})` },
                ...ORDER_STATUSES.map((orderStatus) => ({
                  value: orderStatus,
                  label: `${STATUS_LABELS[orderStatus]} (${statusCounts[orderStatus] || 0})`,
                })),
              ],
            },
            { name: "sort", label: "Sort", value: sort, onChange: setSort, options: SORTS },
          ]}
        >
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <label className="flex items-center gap-1.5">
              <span>From</span>
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={FIELD_CLASS} />
            </label>
            <label className="flex items-center gap-1.5">
              <span>To</span>
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={FIELD_CLASS} />
            </label>
          </div>
        </Toolbar>
      </div>

      {meta ? (
        <SummaryStrip
          items={[
            { label: "Revenue in view", value: money(meta.revenue), hint: `${meta.revenueOrders} paying order${meta.revenueOrders === 1 ? "" : "s"}` },
            { label: "Orders in view", value: meta.total },
            { label: "Avg order value", value: money(meta.averageOrderValue) },
            { label: "Page", value: `${meta.page} / ${meta.pages}`, hint: `${meta.limit} per page` },
          ]}
        />
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {notice && <p className="mb-3 text-sm text-[var(--color-primary-bright)]">{notice}</p>}
          {status === "loading" && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}
          {status === "error" && <p className="text-sm text-[var(--color-danger)]">Could not load orders.</p>}

          {status === "done" && (
            <>
              <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
                    <tr>
                      <th className="px-4 py-3">Order no</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Placed</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o._id} className="border-t border-[var(--color-border)]">
                        <td className="px-4 py-3 font-medium text-white">{o.orderNo}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">
                          {o.customer?.name || o.shippingAddress?.fullName || "-"}
                          {o.customer?.email ? <span className="block text-xs">{o.customer.email}</span> : null}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">{formatDate(o.createdAt)}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">{money(o.total)}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelected(o)}
                            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-muted)]">
                          No orders match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination meta={meta} onPage={setPage} itemLabel="orders" />
              </div>
            </>
          )}
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Orders by status
            </h2>
            <p className="mb-4 mt-1 text-xs text-[var(--color-muted)]">
              Counts follow the search and date filters, not the status filter.
            </p>
            <BarList items={chartRows} formatValue={(value) => `${value}`} emptyMessage="No orders in view." />
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
            <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Revenue mix
            </h2>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-muted)]">Paid</dt>
                <dd className="text-white">
                  {money(orders.filter((o) => o.paymentStatus === "PAID").reduce((sum, o) => sum + Number(o.total || 0), 0))}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-muted)]">Awaiting payment</dt>
                <dd className="text-white">
                  {money(orders.filter((o) => o.paymentStatus === "PENDING").reduce((sum, o) => sum + Number(o.total || 0), 0))}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-[var(--color-muted)]">Totals for the orders currently listed on this page.</p>
          </section>
        </aside>
      </div>

      <Modal
        open={selected !== null}
        title={selected ? `Order ${selected.orderNo}` : "Order"}
        onClose={() => setSelected(null)}
        footer={
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
          >
            Close
          </button>
        }
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={selected.status} />
              <StatusBadge status={selected.paymentStatus} />
              <span className="text-[var(--color-muted)]">Placed {formatDate(selected.createdAt)}</span>
            </div>

            <div className="grid gap-1 rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Customer</p>
              <p className="text-white">{selected.customer?.name || selected.shippingAddress?.fullName || "-"}</p>
              {selected.customer?.email ? <p className="text-[var(--color-muted)]">{selected.customer.email}</p> : null}
              {selected.shippingAddress ? (
                <p className="mt-1 leading-6 text-[var(--color-muted)]">
                  {selected.shippingAddress.line1}
                  {selected.shippingAddress.line2 ? `, ${selected.shippingAddress.line2}` : ""}
                  <br />
                  {selected.shippingAddress.city}, {selected.shippingAddress.state} {selected.shippingAddress.pincode}
                  <br />
                  {selected.shippingAddress.phone}
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-[var(--color-muted)]">Items</p>
              <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.items || []).map((item, index) => (
                      <tr key={index} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2 text-white">{item.name}</td>
                        <td className="px-3 py-2 text-[var(--color-muted)]">{item.quantity}</td>
                        <td className="px-3 py-2 text-[var(--color-muted)]">{money(item.price)}</td>
                        <td className="px-3 py-2 text-right text-[var(--color-muted)]">
                          {money(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                    {(selected.items || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-[var(--color-muted)]">No line items.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <dl className="grid gap-2 rounded-xl border border-[var(--color-border)] p-4">
              <div className="flex justify-between"><dt className="text-[var(--color-muted)]">Subtotal</dt><dd className="text-white">{money(selected.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-muted)]">GST included</dt><dd className="text-white">{money(selected.gstAmount)}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-muted)]">Shipping</dt><dd className="text-white">{money(selected.shipping)}</dd></div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-2 font-semibold"><dt className="text-[var(--color-ink)]">Total</dt><dd className="text-white">{money(selected.total)}</dd></div>
            </dl>

            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-[var(--color-muted)]">Update status</span>
              <select
                className={`${FIELD_CLASS} w-full`}
                value={selected.status}
                disabled={savingStatus}
                onChange={(e) => changeStatus(selected, e.target.value)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
