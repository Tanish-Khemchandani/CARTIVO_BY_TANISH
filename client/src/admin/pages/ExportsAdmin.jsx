import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api, downloadCsv } from "../../api/client";
import { CONTROL_CLASS } from "../components/ui/Toolbar";
import useDebouncedValue from "../hooks/useDebouncedValue";

const ORDER_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "PLACED", label: "Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "DISPATCHED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed" },
  { value: "IN_CHECKOUT", label: "In checkout" },
];

const RESOURCES = {
  orders: {
    label: "Orders",
    filename: "cartivo-orders",
    description: "Order totals, GST, payment and fulfilment status.",
    sorts: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
      { value: "value-desc", label: "Highest value" },
      { value: "value-asc", label: "Lowest value" },
    ],
    columns: "Order no, customer, email, items, subtotal, GST included, shipping, total, status, payment, placed",
    defaultSort: "newest",
  },
  products: {
    label: "Products",
    filename: "cartivo-products",
    description: "Full catalog with pricing, stock and status.",
    sorts: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
      { value: "name", label: "Name A–Z" },
      { value: "price-desc", label: "Highest price" },
      { value: "price-asc", label: "Lowest price" },
      { value: "stock", label: "Lowest stock" },
    ],
    columns: "Name, slug, SKU, brand, category, price, sale price, final price, stock, status, featured, created",
    defaultSort: "newest",
  },
  inventory: {
    label: "Inventory",
    filename: "cartivo-inventory",
    description: "Stock levels and low-stock thresholds per product.",
    sorts: [
      { value: "stock", label: "Lowest stock first" },
      { value: "stock-desc", label: "Highest stock first" },
      { value: "name", label: "Name A–Z" },
      { value: "threshold", label: "Tightest threshold" },
    ],
    columns: "Name, SKU, brand, category, stock, low stock threshold, status",
    defaultSort: "stock",
  },
  users: {
    label: "Customers",
    filename: "cartivo-users",
    description: "Customers with order counts and lifetime spend.",
    sorts: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
      { value: "name", label: "Name A–Z" },
      { value: "spend-desc", label: "Highest spend" },
      { value: "orders-desc", label: "Most orders" },
    ],
    columns: "Name, email, phone, status, orders, total spent, joined",
    defaultSort: "newest",
  },
};

const EMPTY_FILTERS = {
  search: "",
  status: "",
  category: "",
  stock: "",
  orders: "",
  from: "",
  to: "",
};

function money(value) {
  return `\u20b9${Number(value || 0).toLocaleString("en-IN")}`;
}

function shortDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function stockStateOf(row) {
  const stock = Number(row.stock || 0);
  const threshold = Number(row.lowStockThreshold || 0);
  if (stock <= 0) return "Out of stock";
  if (stock <= threshold) return "Low stock";
  return "In stock";
}

// Columns for the on-screen preview. The CSV keeps its full column set; this
// table only shows the fields that help spot a wrong filter at a glance.
const PREVIEW_COLUMNS = {
  orders: [
    { label: "Order", get: (o) => o.orderNo, strong: true },
    { label: "Customer", get: (o) => o.customer?.name || o.shippingAddress?.fullName || "Guest" },
    { label: "Placed", get: (o) => shortDate(o.createdAt) },
    { label: "Items", get: (o) => (o.items || []).reduce((n, i) => n + i.quantity, 0), align: "right" },
    { label: "Total", get: (o) => money(o.total), align: "right" },
    { label: "Status", get: (o) => o.status },
  ],
  products: [
    { label: "Product", get: (p) => p.name, strong: true },
    { label: "Category", get: (p) => p.category?.name || "—" },
    { label: "Final price", get: (p) => money(p.finalPrice ?? p.price), align: "right" },
    { label: "Stock", get: (p) => p.stock, align: "right" },
    { label: "Status", get: (p) => p.status },
  ],
  inventory: [
    { label: "Product", get: (p) => p.name, strong: true },
    { label: "Category", get: (p) => p.category?.name || "—" },
    { label: "Stock", get: (p) => p.stock, align: "right" },
    { label: "Threshold", get: (p) => p.lowStockThreshold, align: "right" },
    { label: "State", get: (p) => stockStateOf(p) },
  ],
  users: [
    { label: "Customer", get: (u) => u.name, strong: true },
    { label: "Email", get: (u) => u.email },
    { label: "Orders", get: (u) => u.orderCount, align: "right" },
    { label: "Spent", get: (u) => money(u.totalSpent), align: "right" },
    { label: "Status", get: (u) => u.status },
  ],
};

export default function ExportsAdmin() {
  const [resource, setResource] = useState("orders");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState(RESOURCES.orders.defaultSort);
  const [categories, setCategories] = useState([]);
  const [preview, setPreview] = useState({ rows: null, sample: [], previewLimit: 12, loading: false, error: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const debouncedSearch = useDebouncedValue(filters.search);
  const config = RESOURCES[resource];

  useEffect(() => {
    api
      .get("/admin/categories")
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  function switchResource(next) {
    setResource(next);
    setFilters(EMPTY_FILTERS);
    setSort(RESOURCES[next].defaultSort);
    setNotice("");
    setError("");
  }

  function buildParams({ withPreview = false } = {}) {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (resource === "orders") {
      if (filters.status) params.set("status", filters.status);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
    }
    if (resource === "products") {
      if (filters.status) params.set("status", filters.status);
      if (filters.category) params.set("category", filters.category);
      if (filters.stock) params.set("stock", filters.stock);
    }
    if (resource === "inventory") {
      if (filters.category) params.set("category", filters.category);
      if (filters.stock) params.set("stockState", filters.stock);
    }
    if (resource === "users") {
      if (filters.status) params.set("status", filters.status);
      if (filters.orders) params.set("orders", filters.orders);
    }
    params.set("sort", sort);
    if (withPreview) params.set("preview", "1");
    return params;
  }

  // Count what the current filters cover, so an empty download never comes
  // as a surprise. filterKey changes whenever any field does.
  const filterKey = [
    resource,
    debouncedSearch,
    filters.status,
    filters.category,
    filters.stock,
    filters.orders,
    filters.from,
    filters.to,
    sort,
  ].join("|");

  useEffect(() => {
    let cancelled = false;
    setPreview((prev) => ({ ...prev, rows: null, sample: [], loading: true, error: "" }));
    api
      .get(`/admin/export/${resource}?${buildParams({ withPreview: true }).toString()}`)
      .then((res) => {
        if (!cancelled) {
          setPreview({
            rows: res.data.rows,
            sample: res.data.sample || [],
            previewLimit: res.data.previewLimit || 12,
            loading: false,
            error: "",
          });
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setPreview({
            rows: null,
            sample: [],
            previewLimit: 12,
            loading: false,
            error: requestError.message || "Could not load matching rows.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // filterKey covers every dependency of buildParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  async function handleDownload() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const params = buildParams();
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadCsv(`/admin/export/${resource}?${params.toString()}`, `${config.filename}-${stamp}.csv`);
      setNotice(
        preview.rows === null
          ? `${config.label} export downloaded.`
          : `${config.label} export downloaded · ${preview.rows} row${preview.rows === 1 ? "" : "s"}.`
      );
    } catch (requestError) {
      setError(requestError.message || "Could not create the export.");
    } finally {
      setBusy(false);
    }
  }

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.category) ||
    Boolean(filters.stock) ||
    Boolean(filters.orders) ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  return (
    <div>
      <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Filtered exports</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Build a report from the same filters the admin panels use, check how many rows it covers, then download the CSV.
        Downloads include every matching row, not just one page.
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Report data set">
        {Object.entries(RESOURCES).map(([key, item]) => {
          const active = key === resource;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchResource(key)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-sm text-[var(--color-muted)]">{config.description}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs text-[var(--color-muted)]">
            <span className="mb-1.5 block">Search</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder={
                resource === "orders"
                  ? "Order number, name, phone or city…"
                  : resource === "users"
                    ? "Name, email or phone…"
                    : "Name, SKU or brand…"
              }
              className={`${CONTROL_CLASS} w-full`}
            />
          </label>

          {(resource === "orders" || resource === "products") && (
            <label className="block text-xs text-[var(--color-muted)]">
              <span className="mb-1.5 block">Status</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                className={`${CONTROL_CLASS} w-full`}
              >
                {resource === "orders"
                  ? ORDER_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  : [
                      { value: "", label: "All statuses" },
                      { value: "active", label: "Active" },
                      { value: "draft", label: "Draft" },
                    ].map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
              </select>
            </label>
          )}

          {resource === "users" && (
            <>
              <label className="block text-xs text-[var(--color-muted)]">
                <span className="mb-1.5 block">Status</span>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                  className={`${CONTROL_CLASS} w-full`}
                >
                  <option value="">All customers</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="block text-xs text-[var(--color-muted)]">
                <span className="mb-1.5 block">Orders</span>
                <select
                  value={filters.orders}
                  onChange={(event) => setFilters((prev) => ({ ...prev, orders: event.target.value }))}
                  className={`${CONTROL_CLASS} w-full`}
                >
                  <option value="">Any order history</option>
                  <option value="with">Has orders</option>
                  <option value="without">No orders yet</option>
                </select>
              </label>
            </>
          )}

          {(resource === "products" || resource === "inventory") && (
            <label className="block text-xs text-[var(--color-muted)]">
              <span className="mb-1.5 block">Category</span>
              <select
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                className={`${CONTROL_CLASS} w-full`}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.parent ? `— ${category.name}` : category.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {resource === "products" && (
            <label className="block text-xs text-[var(--color-muted)]">
              <span className="mb-1.5 block">Stock</span>
              <select
                value={filters.stock}
                onChange={(event) => setFilters((prev) => ({ ...prev, stock: event.target.value }))}
                className={`${CONTROL_CLASS} w-full`}
              >
                <option value="">Any stock level</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </label>
          )}

          {resource === "inventory" && (
            <label className="block text-xs text-[var(--color-muted)]">
              <span className="mb-1.5 block">Stock state</span>
              <select
                value={filters.stock}
                onChange={(event) => setFilters((prev) => ({ ...prev, stock: event.target.value }))}
                className={`${CONTROL_CLASS} w-full`}
              >
                <option value="">Any stock state</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
                <option value="ok">Healthy</option>
              </select>
            </label>
          )}

          {resource === "orders" && (
            <>
              <label className="block text-xs text-[var(--color-muted)]">
                <span className="mb-1.5 block">From</span>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                  className={`${CONTROL_CLASS} w-full`}
                />
              </label>
              <label className="block text-xs text-[var(--color-muted)]">
                <span className="mb-1.5 block">To</span>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                  className={`${CONTROL_CLASS} w-full`}
                />
              </label>
            </>
          )}

          <label className="block text-xs text-[var(--color-muted)]">
            <span className="mb-1.5 block">Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className={`${CONTROL_CLASS} w-full`}>
              {config.sorts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <div className="text-sm">
            {preview.loading ? (
              <span className="text-[var(--color-muted)]">Loading matching rows…</span>
            ) : preview.error ? (
              <span className="text-[var(--color-danger)]">{preview.error}</span>
            ) : (
              <span className="text-[var(--color-muted)]">
                <span className="font-[var(--font-display)] text-lg font-bold text-white">{preview.rows ?? 0}</span>{" "}
                row{(preview.rows ?? 0) === 1 ? "" : "s"} match
                {hasFilters ? " these filters" : " (full data set)"}
              </span>
            )}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[var(--font-display)] text-base font-semibold text-white">Matching rows</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {preview.loading
                ? "Fetching a preview…"
                : preview.error
                  ? "The preview could not be loaded."
                  : preview.rows === 0
                    ? "Nothing matches these filters."
                    : `Showing ${preview.sample.length} of ${preview.rows} matching row${preview.rows === 1 ? "" : "s"}. ${
                        preview.rows > preview.sample.length ? `The CSV contains all ${preview.rows}.` : "The CSV matches this list."
                      }`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy || preview.loading || preview.rows === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {busy ? "Preparing…" : `Download ${config.label.toLowerCase()} CSV`}
          </button>
        </div>

        {preview.error ? (
          <p className="mt-4 rounded-xl bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            {preview.error}
          </p>
        ) : preview.loading ? (
          <p className="mt-4 text-sm text-[var(--color-muted)]">Loading…</p>
        ) : preview.sample.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted)]">
            No rows match these filters. Clear or widen them to see data.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
                <tr>
                  {PREVIEW_COLUMNS[resource].map((column) => (
                    <th
                      key={column.label}
                      className={`whitespace-nowrap px-3 py-2 font-medium ${column.align === "right" ? "text-right" : ""}`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sample.map((row, index) => (
                  <tr key={row._id || index} className="border-t border-[var(--color-border)]">
                    {PREVIEW_COLUMNS[resource].map((column) => (
                      <td
                        key={column.label}
                        className={`whitespace-nowrap px-3 py-2 ${column.align === "right" ? "text-right" : ""} ${
                          column.strong ? "font-medium text-white" : "text-[var(--color-muted)]"
                        }`}
                      >
                        {column.get(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-xs text-[var(--color-muted)]">
          CSV columns: {config.columns}.
          {preview.rows > preview.sample.length ? ` Preview shows the first ${preview.sample.length} rows only.` : ""}
        </p>
      </section>

      {notice && <p className="mt-4 text-sm text-[var(--color-primary-bright)]">{notice}</p>}
      {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
