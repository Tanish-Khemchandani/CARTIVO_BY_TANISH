import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Package, PackageSearch } from "lucide-react";
import AccountShell from "../components/account/AccountShell";
import { accountApi } from "../api/customer";

const STATUS_LABELS = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  DISPATCHED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

const STATUS_BADGE = {
  PLACED: "bg-sky-50 text-sky-700",
  CONFIRMED: "bg-sky-50 text-sky-700",
  PROCESSING: "bg-amber-50 text-amber-700",
  DISPATCHED: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  FAILED: "bg-rose-50 text-rose-700",
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const itemCount = (order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0);
  const terminal = order.status === "CANCELLED" || order.status === "FAILED";

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="break-words font-[var(--font-display)] text-base font-bold text-[var(--color-ink)]">
            {order.orderNo}
          </h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Placed {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold " +
              (STATUS_BADGE[order.status] || "bg-[var(--color-surface)] text-[var(--color-muted)]")
            }
          >
            {STATUS_LABELS[order.status] || order.status}
          </span>
          <span className="shrink-0 font-[var(--font-display)] text-sm font-bold text-[var(--color-ink)]">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-t border-[var(--color-border)] px-4 py-3 text-left text-sm font-semibold text-[var(--color-primary-bright)] transition hover:bg-[var(--color-surface)] sm:px-5"
      >
        {open ? "Hide details" : "View details"}
        <ChevronDown
          className={"h-4 w-4 transition-transform " + (open ? "rotate-180" : "")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="border-t border-[var(--color-border)] p-4 sm:p-5">
          <ul className="divide-y divide-[var(--color-border)]">
            {(order.items || []).map((item, index) => (
              <li
                key={item.name + index}
                className="flex items-start justify-between gap-4 py-2.5 text-sm first:pt-0"
              >
                <span className="min-w-0">
                  <span className="block text-[var(--color-ink)]">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
                    Qty {item.quantity} · {formatPrice(item.price)} each
                  </span>
                </span>
                <span className="shrink-0 font-medium text-[var(--color-ink)]">
                  {formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)]">
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd className="font-medium text-[var(--color-ink)]">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Delivery</dt>
              <dd className="font-medium text-[var(--color-ink)]">
                {Number(order.shipping) === 0 ? "Free" : formatPrice(order.shipping)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-[var(--color-border)] pt-2 text-base">
              <dt className="font-bold text-[var(--color-ink)]">Total</dt>
              <dd className="font-[var(--font-display)] font-bold text-[var(--color-ink)]">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
            {terminal
              ? "No payment is due for this order."
              : order.paymentStatus === "PAID"
                ? "Payment received. Thank you."
                : `Cash on Delivery · pay ${formatPrice(order.total)} when your order arrives.`}
          </p>

          {order.shippingAddress ? (
            <div className="mt-4 rounded-xl bg-[var(--color-surface)] p-3.5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                Delivery address
              </p>
              <p className="mt-1 leading-6 text-[var(--color-muted)]">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? (
                  <>
                    <br />
                    {order.shippingAddress.line2}
                  </>
                ) : null}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.pincode}
                <br />
                {order.shippingAddress.phone}
              </p>
            </div>
          ) : null}

          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Something wrong with this order?{" "}
            <Link to="/contact" className="font-semibold text-[var(--color-primary-bright)] hover:underline">
              Contact support
            </Link>{" "}
            and quote the order number.
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default function AccountOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "My orders | CARTIVO";
  }, []);

  useEffect(() => {
    let active = true;
    accountApi
      .orders()
      .then((response) => {
        if (!active) return;
        setOrders(response.data || []);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "Your orders could not be loaded.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AccountShell
      title="My orders"
      description="Every order placed while signed in to this account, newest first."
    >
      {status === "loading" ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            />
          ))}
        </div>
      ) : null}

      {status === "error" ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {status === "ready" && orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
          <Package className="h-9 w-9 text-[var(--color-faint)]" aria-hidden="true" />
          <p className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">
            No orders yet
          </p>
          <p className="max-w-md text-sm text-[var(--color-muted)]">
            Orders you place while signed in appear here. Guest orders can still be followed on the
            tracking page with the order number and phone you used.
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
            >
              Start shopping
            </Link>
            <Link
              to="/track-order"
              className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary-bright)] hover:underline"
            >
              <PackageSearch className="h-4 w-4" aria-hidden="true" /> Track an order
            </Link>
          </div>
        </div>
      ) : null}

      {status === "ready" && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      ) : null}
    </AccountShell>
  );
}
