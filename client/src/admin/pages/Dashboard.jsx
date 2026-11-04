import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import BarChart from "../components/charts/BarChart";
import LineChart from "../components/charts/LineChart";
import DonutChart from "../components/charts/DonutChart";
import BarList from "../components/charts/BarList";

const PANEL_CLASS = "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]";
const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const STATUS_LABELS = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  DISPATCHED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
  IN_CHECKOUT: "In checkout",
};

function money(value) {
  return `\u20b9${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function compactMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `\u20b9${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `\u20b9${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `\u20b9${(amount / 1000).toFixed(1)}k`;
  return `\u20b9${amount}`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`${PANEL_CLASS} ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {title}
        </h2>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

function AttentionRow({ to, label, count, tone }) {
  const countClass =
    tone === "danger"
      ? "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
      : "bg-[var(--color-warning)]/15 text-[var(--color-warning)]";

  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm transition hover:bg-[var(--color-surface-soft)]"
    >
      <span className="text-[var(--color-ink)]">{label}</span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${countClass}`}>{count}</span>
    </Link>
  );
}

export default function Dashboard() {
  const [days, setDays] = useState("7");
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    api
      .get(`/admin/summary?days=${days}`)
      .then((res) => {
        if (!active) return;
        setSummary(res.data);
        setStatus("done");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [days, reloadKey]);

  const rangeLabel = RANGES.find((range) => range.value === days)?.label.toLowerCase() || "range";
  const needsAttention =
    summary && (summary.lowStock > 0 || summary.pendingReviews > 0 || summary.newInquiries > 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Live store performance, straight from the database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="sr-only">Date range</span>
            <select
              value={days}
              onChange={(event) => setDays(event.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary-bright)]"
            >
              {RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={status === "loading"}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)] disabled:opacity-60"
          >
            {status === "loading" ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {status === "loading" && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--color-surface)]" />
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="h-80 animate-pulse rounded-2xl bg-[var(--color-surface)] lg:col-span-2" />
            <div className="h-80 animate-pulse rounded-2xl bg-[var(--color-surface)]" />
          </div>
        </>
      )}

      {status === "error" && (
        <div className={`${PANEL_CLASS} mt-6 p-6 text-sm`}>
          <p className="text-[var(--color-danger)]">Could not load the dashboard. Is the server running?</p>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setReloadKey((key) => key + 1);
            }}
            className="mt-3 rounded-lg border border-[var(--color-border)] px-3 py-1.5 font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
          >
            Try again
          </button>
        </div>
      )}

      {status === "done" && summary && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label={`Sales · ${rangeLabel}`}
              value={money(summary.window.revenue)}
              hint={`${summary.window.orders} order${summary.window.orders === 1 ? "" : "s"}`}
            />
            <StatCard
              label="Avg order value"
              value={money(summary.window.averageOrderValue)}
              hint={`All time ${money(summary.sales.averageOrderValue)}`}
            />
            <StatCard
              label="This month"
              value={money(summary.sales.thisMonth)}
              hint={`${summary.sales.ordersThisMonth} order${summary.sales.ordersThisMonth === 1 ? "" : "s"}`}
            />
            <StatCard
              label="Customers"
              value={summary.totalCustomers}
              hint={`+${summary.window.customers} in ${rangeLabel}`}
            />
            <StatCard
              label="Low stock"
              value={summary.lowStock}
              tone={summary.lowStock > 0 ? "warning" : "default"}
              hint={summary.outOfStock > 0 ? `${summary.outOfStock} out of stock` : "All above threshold"}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Panel
              className="lg:col-span-2"
              title={`Revenue and orders · ${rangeLabel}`}
              action={
                <p className="text-xs text-[var(--color-muted)]">
                  {money(summary.window.revenue)} · {summary.window.orders} orders · cancelled and failed excluded
                </p>
              }
            >
              <BarChart
                points={summary.series}
                primaryKey="revenue"
                secondaryKey="orders"
                primaryLabel="Revenue"
                secondaryLabel="Orders"
                formatPrimary={compactMoney}
                formatSecondary={(value) => `${value} order${value === 1 ? "" : "s"}`}
                height={240}
              />
            </Panel>

            <Panel title="Order status" action={<span className="text-xs text-[var(--color-muted)]">{rangeLabel}</span>}>
              <DonutChart
                slices={summary.statusSplit.map((row) => ({
                  label: STATUS_LABELS[row.status] || row.status,
                  value: row.count,
                }))}
                formatValue={(value) => `${value}`}
                centerValue={String(summary.statusSplit.reduce((sum, row) => sum + row.count, 0))}
                centerLabel="orders"
                emptyMessage="No orders in this range."
              />
            </Panel>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Panel title="Top products" action={<span className="text-xs text-[var(--color-muted)]">by revenue</span>}>
              <BarList
                items={summary.topProducts.map((product) => ({
                  label: product.name,
                  value: product.revenue,
                  units: `${product.units} sold`,
                }))}
                valueKey="value"
                secondaryKey="units"
                formatValue={money}
                emptyMessage="No products sold in this range."
              />
            </Panel>

            <Panel title="Revenue by category" action={<span className="text-xs text-[var(--color-muted)]">{money(summary.categoryTotal)}</span>}>
              <DonutChart
                slices={summary.categorySplit.map((row) => ({ label: row.name, value: row.revenue }))}
                formatValue={compactMoney}
                centerValue={compactMoney(summary.categoryTotal)}
                centerLabel="total"
                emptyMessage="No category revenue in this range."
              />
            </Panel>

            <Panel title="New customers" action={<span className="text-xs text-[var(--color-muted)]">{summary.window.customers} joined</span>}>
              <LineChart
                points={summary.series}
                valueKey="customers"
                formatValue={(value) => `${value} customer${value === 1 ? "" : "s"}`}
                height={150}
                emptyMessage="No new customers in this range."
              />
            </Panel>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Panel title="Top customers" action={<span className="text-xs text-[var(--color-muted)]">by spend</span>}>
              <BarList
                items={summary.topSpenders.map((spender) => ({
                  id: spender.id,
                  label: spender.name,
                  value: spender.revenue,
                  orders: `${spender.orders} order${spender.orders === 1 ? "" : "s"}`,
                }))}
                valueKey="value"
                secondaryKey="orders"
                formatValue={money}
                color="var(--color-accent)"
                emptyMessage="No customer revenue in this range."
              />
            </Panel>

            <Panel title="Needs attention">
              {needsAttention ? (
                <div className="flex flex-col gap-2">
                  {summary.lowStock > 0 && (
                    <AttentionRow to="/admin/inventory" label="Low stock products" count={summary.lowStock} tone="warning" />
                  )}
                  {summary.pendingReviews > 0 && (
                    <AttentionRow to="/admin/reviews" label="Reviews awaiting moderation" count={summary.pendingReviews} tone="warning" />
                  )}
                  {summary.newInquiries > 0 && (
                    <AttentionRow to="/admin/contact-inquiries" label="New contact inquiries" count={summary.newInquiries} tone="danger" />
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-[var(--color-border)] px-3 py-6 text-center text-sm text-[var(--color-muted)]">
                  All caught up. Nothing needs a decision right now.
                </p>
              )}

              {summary.lowStockProducts.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Lowest stock</p>
                  <ul className="mt-2 space-y-2">
                    {summary.lowStockProducts.map((product) => (
                      <li key={product._id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-[var(--color-ink)]" title={product.name}>
                          {product.name}
                          {product.sku ? <span className="ml-1 text-xs text-[var(--color-muted)]">{product.sku}</span> : null}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            Number(product.stock) <= 0
                              ? "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
                              : "bg-[var(--color-warning)]/15 text-[var(--color-warning)]"
                          }`}
                        >
                          {Number(product.stock) <= 0 ? "Out" : `${product.stock} left`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
          </div>

          <section className={`${PANEL_CLASS} mt-6`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Recent orders
              </h2>
              <Link to="/admin/orders" className="text-sm font-medium text-[var(--color-primary-bright)] hover:underline">
                View all orders
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
                  <tr>
                    <th className="px-5 py-3">Order no</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Placed</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentOrders.map((order) => (
                    <tr key={order._id} className="border-t border-[var(--color-border)]">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-white">{order.orderNo}</td>
                      <td className="px-5 py-3 text-[var(--color-muted)]">
                        {order.customer?.name || "-"}
                        {order.customer?.email ? <span className="block text-xs">{order.customer.email}</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-[var(--color-muted)]">{formatDate(order.createdAt)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-[var(--color-muted)]">{money(order.total)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                  {summary.recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-[var(--color-muted)]">
                        No orders yet. New checkouts will show up here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
