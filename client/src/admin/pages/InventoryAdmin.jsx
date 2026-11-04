import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import Modal from "../components/ui/Modal";
import DonutChart from "../components/charts/DonutChart";
import Pagination from "../components/ui/Pagination";
import { SummaryStrip, Toolbar } from "../components/ui/Toolbar";
import useDebouncedValue from "../hooks/useDebouncedValue";

const INVENTORY_SORTS = [
  { value: "stock", label: "Lowest stock first" },
  { value: "stock-desc", label: "Highest stock first" },
  { value: "name", label: "Name A–Z" },
  { value: "threshold", label: "Tightest threshold" },
];

const FIELD_CLASS =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]";

function stockTone(row) {
  if (row.outOfStock) return { label: "Out of stock", className: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]" };
  if (row.lowStock) return { label: "Low stock", className: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]" };
  return { label: "In stock", className: "bg-[var(--color-success)]/15 text-[var(--color-success)]" };
}

export default function InventoryAdmin() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, lowStock: 0, outOfStock: 0 });
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockState, setStockState] = useState("");
  const [sort, setSort] = useState("stock");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [adjusting, setAdjusting] = useState(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20", sort });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter) params.set("category", categoryFilter);
    if (stockState) params.set("stockState", stockState);

    const [res, categoryRes] = await Promise.all([
      api.get(`/admin/inventory?${params.toString()}`),
      categories.length ? Promise.resolve({ data: categories }) : api.get("/admin/categories"),
    ]);
    setRows(res.data);
    setMeta(res.meta || { total: res.data.length, lowStock: 0, outOfStock: 0 });
    setCategories(categoryRes.data);
    setStatus("done");
  }, [debouncedSearch, categoryFilter, stockState, sort, page, categories]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter, stockState, sort]);

  useEffect(() => {
    setStatus("loading");
    load().catch(() => setStatus("error"));
  }, [load]);

  function resetFilters() {
    setSearch("");
    setCategoryFilter("");
    setStockState("");
    setSort("stock");
  }

  function openAdjust(row) {
    setAdjusting(row);
    setDelta("");
    setReason("");
    setFormError("");
  }

  async function handleAdjust(event) {
    event.preventDefault();
    setFormError("");
    const value = Number(delta);
    if (!Number.isInteger(value) || value === 0) return setFormError("Enter a non-zero whole number of units (use a minus sign to remove).");

    setSaving(true);
    try {
      await api.post(`/admin/inventory/${adjusting._id}/adjust`, { delta: value, reason: reason.trim() });
      await load();
      setNotice(`${value > 0 ? "Added" : "Removed"} ${Math.abs(value)} unit(s) for ${adjusting.name}.`);
      setAdjusting(null);
    } catch (requestError) {
      setFormError(requestError.message || "Could not adjust stock.");
    } finally {
      setSaving(false);
    }
  }

  async function openHistory(row) {
    setHistoryFor(row);
    setHistory(null);
    try {
      const res = await api.get(`/admin/inventory/${row._id}/history`);
      setHistory(res.data);
    } catch {
      setHistory({ product: row, adjustments: [] });
    }
  }

  const resulting = adjusting ? Number(adjusting.stock) + (Number(delta) || 0) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Inventory</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Watch stock levels and record every manual adjustment with a reason.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Toolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search by name, SKU or brand…"
          onReset={resetFilters}
          filters={[
            {
              name: "category",
              label: "Category",
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: "", label: "All categories" },
                ...categories.map((category) => ({ value: category._id, label: category.name })),
              ],
            },
            {
              name: "state",
              label: "Stock state",
              value: stockState,
              onChange: setStockState,
              options: [
                { value: "", label: "Any stock state" },
                { value: "low", label: `Low stock (${meta.lowStock ?? 0})` },
                { value: "out", label: `Out of stock (${meta.outOfStock ?? 0})` },
                { value: "ok", label: `Healthy (${meta.healthy ?? 0})` },
              ],
            },
            { name: "sort", label: "Sort", value: sort, onChange: setSort, options: INVENTORY_SORTS },
          ]}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <SummaryStrip
            items={[
              { label: "Matching products", value: meta.total, hint: `${meta.pages ?? 1} page${meta.pages === 1 ? "" : "s"}` },
              { label: "Units tracked", value: meta.units ?? 0 },
              { label: "Low stock", value: meta.lowStock, tone: meta.lowStock > 0 ? "warning" : "default" },
              { label: "Out of stock", value: meta.outOfStock, tone: meta.outOfStock > 0 ? "danger" : "default" },
            ]}
          />
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Counts cover the whole catalog, so they do not change while a filter is applied.
          </p>
        </div>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Stock health
          </h2>
          <div className="mt-3">
            <DonutChart
              slices={[
                { label: "Healthy", value: meta.healthy ?? 0, color: "var(--color-success)" },
                { label: "Low stock", value: meta.lowStock ?? 0, color: "var(--color-warning)" },
                { label: "Out of stock", value: meta.outOfStock ?? 0, color: "var(--color-danger)" },
              ]}
              formatValue={(value) => `${value}`}
              centerValue={String(meta.catalogTotal ?? 0)}
              centerLabel="products"
              emptyMessage="No products in the catalog yet."
            />
          </div>
        </section>
      </div>

      {notice && <p className="mt-4 text-sm text-[var(--color-primary-bright)]">{notice}</p>}
      {status === "loading" && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading...</p>}
      {status === "error" && <p className="mt-6 text-sm text-[var(--color-danger)]">Could not load inventory.</p>}

      {status === "done" && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Threshold</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const tone = stockTone(row);
                return (
                  <tr key={row._id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{row.name}</p>
                      {row.sku ? <p className="text-xs text-[var(--color-muted)]">{row.sku}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{row.category?.name || "-"}</td>
                    <td className="px-4 py-3 font-medium text-white">{row.stock}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{row.lowStockThreshold}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone.className}`}>{tone.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openAdjust(row)}
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          onClick={() => openHistory(row)}
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-muted)]">
                    No products match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination meta={meta} onPage={setPage} itemLabel="products" />
        </div>
      )}

      <Modal
        open={adjusting !== null}
        title={adjusting ? `Adjust stock - ${adjusting.name}` : "Adjust stock"}
        maxWidth="max-w-lg"
        onClose={() => (saving ? null : setAdjusting(null))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setAdjusting(null)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="inventory-form"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Apply adjustment"}
            </button>
          </>
        }
      >
        {adjusting && (
          <form id="inventory-form" onSubmit={handleAdjust} className="grid gap-4">
            <p className="text-sm text-[var(--color-muted)]">
              Current stock <span className="font-semibold text-white">{adjusting.stock}</span>
            </p>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Change (+/- units)</span>
              <input
                type="number"
                step="1"
                className={FIELD_CLASS}
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="e.g. 20 or -3"
                autoFocus
              />
            </label>
            <p className="text-sm text-[var(--color-muted)]">
              New stock will be <span className="font-semibold text-white">{resulting}</span>
            </p>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Reason</span>
              <input
                className={FIELD_CLASS}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Restock, damaged, stocktake correction..."
              />
            </label>
            {formError && <p role="alert" className="text-sm text-[var(--color-danger)]">{formError}</p>}
          </form>
        )}
      </Modal>

      <Modal
        open={historyFor !== null}
        title={historyFor ? `Stock history - ${historyFor.name}` : "Stock history"}
        onClose={() => setHistoryFor(null)}
        footer={
          <button
            type="button"
            onClick={() => setHistoryFor(null)}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
          >
            Close
          </button>
        }
      >
        {!history && <p className="text-sm text-[var(--color-muted)]">Loading...</p>}
        {history && (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Change</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">By</th>
                </tr>
              </thead>
              <tbody>
                {(history.adjustments || []).map((entry) => (
                  <tr key={entry._id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2 text-[var(--color-muted)]">{new Date(entry.createdAt).toLocaleString("en-IN")}</td>
                    <td className={`px-3 py-2 font-medium ${entry.delta > 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </td>
                    <td className="px-3 py-2 text-white">{entry.resultingStock}</td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">{entry.reason || "-"}</td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">{entry.adjustedBy || "-"}</td>
                  </tr>
                ))}
                {(history.adjustments || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-5 text-center text-[var(--color-muted)]">
                      No adjustments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
