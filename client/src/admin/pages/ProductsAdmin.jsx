import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";
import PhotoUploader from "../components/product/PhotoUploader";
import Pagination from "../components/ui/Pagination";
import { SummaryStrip, Toolbar } from "../components/ui/Toolbar";
import useDebouncedValue from "../hooks/useDebouncedValue";

const PRODUCT_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "price-desc", label: "Price high → low" },
  { value: "price-asc", label: "Price low → high" },
  { value: "stock", label: "Lowest stock" },
];

function formatPrice(v) {
  return `\u20b9${Number(v || 0).toLocaleString("en-IN")}`;
}

const FIELD_CLASS =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]";

const emptyForm = {
  name: "",
  brand: "",
  category: "",
  price: "",
  salePrice: "",
  stock: "",
  lowStockThreshold: "5",
  sku: "",
  images: [],
  options: {},
  description: "",
  featured: false,
  status: "active",
};

function toForm(product) {
  return {
    name: product.name || "",
    brand: product.brand || "",
    category: product.category?._id || product.category || "",
    price: product.price ?? "",
    salePrice: product.salePrice || "",
    stock: product.stock ?? "",
    lowStockThreshold: product.lowStockThreshold ?? 5,
    sku: product.sku || "",
    images: (product.images || []).map((url) => ({ url, hash: "" })),
    options: product.options || {},
    description: product.description || "",
    featured: Boolean(product.featured),
    status: product.status || "active",
  };
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const [editing, setEditing] = useState(null); // null = closed; { _id? , ...form }
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20", sort });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (stockFilter) params.set("stock", stockFilter);

    const [productRes, categoryRes] = await Promise.all([
      api.get(`/admin/products?${params.toString()}`),
      categories.length ? Promise.resolve({ data: categories }) : api.get("/admin/categories"),
    ]);
    setProducts(productRes.data);
    setMeta(productRes.meta || null);
    setCategories(categoryRes.data);
    setStatus("done");
  }, [debouncedSearch, categoryFilter, statusFilter, stockFilter, sort, page, categories]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter, statusFilter, stockFilter, sort]);

  useEffect(() => {
    load().catch(() => setStatus("error"));
  }, [load]);

  function resetFilters() {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setStockFilter("");
    setSort("newest");
  }

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setEditing({});
  }

  function openEdit(product) {
    setForm(toForm(product));
    setFormError("");
    setEditing(product);
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
    const price = Number(form.price);
    if (!name) return setFormError("Product name is required.");
    if (!form.category) return setFormError("Choose a category.");
    if (!Number.isFinite(price) || price < 0) return setFormError("Enter a valid price.");
    if (form.images.length < 3) {
      return setFormError("Add at least 3 distinct photos of the product.");
    }

    const payload = {
      name,
      brand: form.brand.trim(),
      category: form.category,
      price,
      salePrice: Number(form.salePrice) || 0,
      stock: Number(form.stock) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      sku: form.sku.trim(),
      description: form.description.trim(),
      images: form.images.map((img) => img.url),
      options: Object.fromEntries(Object.entries(form.options).map(([key, value]) => [key, String(value).split(",").map((option) => option.trim()).filter(Boolean)]).filter(([, values]) => values.length)),
      featured: Boolean(form.featured),
      status: form.status,
    };

    setSaving(true);
    try {
      if (editing?._id) {
        await api.patch(`/products/${editing._id}`, payload);
        setNotice("Product updated.");
      } else {
        await api.post("/products", payload);
        setNotice("Product created.");
      }
      await load();
      setEditing(null);
    } catch (requestError) {
      setFormError(requestError.message || "Could not save the product.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(product) {
    setBusyId(product._id);
    setNotice("");
    try {
      const next = product.status === "active" ? "draft" : "active";
      await api.patch(`/products/${product._id}`, { status: next });
      await load();
      setNotice(next === "active" ? "Product published." : "Product unpublished.");
    } catch (requestError) {
      setNotice(requestError.message || "Could not change the product status.");
    } finally {
      setBusyId("");
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`Delete "${product.name}"? It will be unpublished and hidden from the store.`)) return;
    setBusyId(product._id);
    setNotice("");
    try {
      await api.delete(`/products/${product._id}`);
      await load();
      setNotice("Product deleted.");
    } catch (requestError) {
      setNotice(requestError.message || "Could not delete the product.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Products</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Create, edit, publish and remove catalog products.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          New product
        </button>
      </div>

      <div className="mt-5">
        <Toolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Product name, SKU or brand…"
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
              name: "status",
              label: "State",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "", label: `Published (${meta?.active ?? 0})` },
                { value: "active", label: "Published only" },
                { value: "draft", label: `Draft / unpublished (${meta?.draft ?? 0})` },
              ],
            },
            {
              name: "stock",
              label: "Stock",
              value: stockFilter,
              onChange: setStockFilter,
              options: [
                { value: "", label: "Any stock" },
                { value: "low", label: `Low stock (${meta?.lowStock ?? 0})` },
                { value: "out", label: `Out of stock (${meta?.outOfStock ?? 0})` },
              ],
            },
            { name: "sort", label: "Sort", value: sort, onChange: setSort, options: PRODUCT_SORTS },
          ]}
        />
      </div>

      {meta ? (
        <SummaryStrip
          items={[
            { label: "Matching products", value: meta.total, hint: `${meta.pages} page${meta.pages === 1 ? "" : "s"}` },
            { label: "Published", value: meta.active },
            { label: "Drafts", value: meta.draft },
            { label: "Low / out of stock", value: `${meta.lowStock} / ${meta.outOfStock}`, tone: meta.outOfStock > 0 ? "danger" : meta.lowStock > 0 ? "warning" : "default" },
          ]}
        />
      ) : null}

      {notice && <p className="mt-4 text-sm text-[var(--color-primary-bright)]">{notice}</p>}
      {status === "loading" && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading...</p>}
      {status === "error" && <p className="mt-6 text-sm text-[var(--color-danger)]">Could not load products.</p>}

      {status === "done" && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{p.name}</p>
                    {p.brand ? <p className="text-xs text-[var(--color-muted)]">{p.brand}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{p.category?.name || "-"}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{formatPrice(p.finalPrice)}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{p.stock}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status === "active" ? "ACTIVE" : "DRAFT"} /></td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{p.featured ? "Yes" : "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p._id}
                        onClick={() => toggleStatus(p)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)] disabled:opacity-50"
                      >
                        {p.status === "active" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p._id}
                        onClick={() => removeProduct(p)}
                        className="rounded-lg border border-[var(--color-danger)]/40 px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-muted)]">
                    No products match these filters. Use "New product" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination meta={meta} onPage={setPage} itemLabel="products" />
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing?._id ? "Edit product" : "New product"}
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
              form="product-form"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : editing?._id ? "Save changes" : "Create product"}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Name</span>
            <input className={FIELD_CLASS} value={form.name} onChange={(e) => setField("name", e.target.value)} required />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Brand</span>
            <input className={FIELD_CLASS} value={form.brand} onChange={(e) => setField("brand", e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Category</span>
            <select className={FIELD_CLASS} value={form.category} onChange={(e) => setField("category", e.target.value)} required>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.active === false ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Price (INR)</span>
            <input type="number" min="0" step="0.01" className={FIELD_CLASS} value={form.price} onChange={(e) => setField("price", e.target.value)} required />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Sale price (0 = none)</span>
            <input type="number" min="0" step="0.01" className={FIELD_CLASS} value={form.salePrice} onChange={(e) => setField("salePrice", e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Stock</span>
            <input type="number" min="0" step="1" className={FIELD_CLASS} value={form.stock} onChange={(e) => setField("stock", e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Low stock threshold</span>
            <input type="number" min="0" step="1" className={FIELD_CLASS} value={form.lowStockThreshold} onChange={(e) => setField("lowStockThreshold", e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">SKU</span>
            <input className={FIELD_CLASS} value={form.sku} onChange={(e) => setField("sku", e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Status</span>
            <select className={FIELD_CLASS} value={form.status} onChange={(e) => setField("status", e.target.value)}>
              <option value="active">Active (visible in store)</option>
              <option value="draft">Draft (hidden)</option>
            </select>
          </label>

          <label className="sm:col-span-2 block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Selectable options</span>
            <textarea rows={4} className={FIELD_CLASS} value={Object.entries(form.options || {}).map(([name, values]) => `${name}: ${Array.isArray(values) ? values.join(", ") : values}`).join("\n")} onChange={(event) => {
              const options = Object.fromEntries(event.target.value.split("\n").map((line) => {
                const separator = line.indexOf(":");
                return separator < 0 ? null : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
              }).filter((entry) => entry && entry[0]).map(([name, values]) => [name, values]));
              setField("options", options);
            }} placeholder={"Color: Black, Blue, White\nSize: S, M, L, XL\nStorage: 128GB, 256GB"} />
            <span className="mt-1 block text-xs text-[var(--color-muted)]">Enter one option per line as “Name: Choice 1, Choice 2”. Leave blank if this product has no selectable options.</span>
          </label>

          <PhotoUploader images={form.images} setImages={(updater) => setField("images", updater(form.images))} />

          <label className="sm:col-span-2 block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-ink)]">Description</span>
            <textarea rows={4} className={FIELD_CLASS} value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </label>

          <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
            <input type="checkbox" checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />
            Featured on the storefront
          </label>

          {formError && <p role="alert" className="sm:col-span-2 text-sm text-[var(--color-danger)]">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
}
