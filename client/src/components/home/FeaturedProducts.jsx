import { useEffect, useState } from "react";
import { getFeaturedProducts } from "../../api/products";
import ProductCard from "../product/ProductCard";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    getFeaturedProducts()
      .then((res) => {
        setProducts(res.data);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <section className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-12 2xl:px-16">
      <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
        Featured products
      </h2>

      {status === "loading" && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-[var(--color-surface)]" />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="mt-5 text-sm text-[var(--color-muted)]">
          Could not load products right now. Try refreshing the page.
        </p>
      )}

      {status === "done" && products.length === 0 && (
        <p className="mt-5 text-sm text-[var(--color-muted)]">No featured products yet.</p>
      )}

      {status === "done" && products.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
