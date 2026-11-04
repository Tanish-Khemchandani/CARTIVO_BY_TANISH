import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, CircleAlert, PackageSearch, Search } from "lucide-react";
import PageHeader from "../components/content/PageHeader";
import { api } from "../api/client";

const STEPS = [
  { key: "PLACED", label: "Order placed", help: "We have received your order." },
  { key: "CONFIRMED", label: "Confirmed", help: "The order has been confirmed." },
  { key: "PROCESSING", label: "Processing", help: "Your items are being prepared." },
  { key: "DISPATCHED", label: "Shipped", help: "The parcel is with the delivery partner." },
  { key: "DELIVERED", label: "Delivered", help: "The order has reached you." },
];

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

const FIELD_CLASS =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-bright)] focus:ring-2 focus:ring-[var(--color-primary-bright)]/15";
const LABEL_CLASS = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]";

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

function OrderSummary({ order }) {
  const terminal = order.status === "CANCELLED" || order.status === "FAILED";
  const currentIndex = STEPS.findIndex((step) => step.key === order.status);
  const paid = order.paymentStatus === "PAID";

  return (
    <article className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary-bright)]">
            Order status
          </p>
          <h2 className="mt-1 break-words font-[var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            {order.orderNo}
          </h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Placed on {formatDate(order.placedAt)}</p>
        </div>
        <span className={"shrink-0 rounded-full px-3 py-1 text-xs font-semibold " + (STATUS_BADGE[order.status] || "bg-[var(--color-surface)] text-[var(--color-muted)]")}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {terminal ? (
        <div className="flex items-start gap-3 border-b border-[var(--color-border)] p-4 sm:p-5">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              This order was {order.status === "CANCELLED" ? "cancelled" : "not completed"}.
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              {order.paymentStatus === "REFUNDED"
                ? "Any refund for this order has been initiated. Contact support if you have not received it."
                : "No payment is due. If you were charged or need help with this order, contact support with the order number."}
            </p>
            <Link to="/contact" className="mt-2 inline-flex text-sm font-semibold text-[var(--color-primary-bright)] hover:underline">
              Contact support
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-b border-[var(--color-border)] p-4 sm:p-5">
          <ol aria-label="Order progress">
            {STEPS.map((step, index) => {
              const done = index < currentIndex;
              const current = index === currentIndex;
              return (
                <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < STEPS.length - 1 ? (
                    <span
                      className={"absolute bottom-0 left-[11px] top-6 w-0.5 " + (done ? "bg-emerald-500" : "bg-[var(--color-border)]")}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={
                      "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white " +
                      (done
                        ? "bg-emerald-600"
                        : current
                          ? "bg-[var(--color-primary)]"
                          : "border border-[var(--color-border)] bg-white text-[var(--color-faint)]")
                    }
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <span className={"h-1.5 w-1.5 rounded-full " + (current ? "bg-white" : "bg-[var(--color-faint)]")} aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className={"text-sm font-semibold " + (current || done ? "text-[var(--color-ink)]" : "text-[var(--color-faint)]")}>
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-[var(--color-muted)]">{step.help}</p>
                    {current ? (
                      <p className="mt-0.5 text-xs font-medium text-[var(--color-primary-bright)]">
                        Current status · updated {formatDate(order.updatedAt)}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <h3 className="font-[var(--font-display)] text-base font-bold text-[var(--color-ink)]">Items</h3>
        <ul className="mt-3 divide-y divide-[var(--color-border)]">
          {order.items.map((item, index) => (
            <li key={item.name + index} className="flex items-start justify-between gap-4 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="block text-[var(--color-ink)]">{item.name}</span>
                <span className="mt-0.5 block text-xs text-[var(--color-muted)]">Qty {item.quantity}</span>
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
          {order.gstAmount > 0 && (
            <div className="flex justify-between gap-4">
              <dt>GST included</dt>
              <dd className="font-medium text-[var(--color-ink)]">{formatPrice(order.gstAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt>Delivery</dt>
            <dd className="font-medium text-[var(--color-ink)]">{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-[var(--color-border)] pt-2 text-base">
            <dt className="font-bold text-[var(--color-ink)]">Total</dt>
            <dd className="font-[var(--font-display)] font-bold text-[var(--color-ink)]">{formatPrice(order.total)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
          {terminal
            ? "No payment is due for this order."
            : paid
              ? "Payment received. Thank you."
              : "Cash on Delivery · pay " + formatPrice(order.total) + " when your order arrives."}
        </p>
      </div>
    </article>
  );
}

export default function TrackOrder() {
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    document.title = "Track your order | CARTIVO";
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanOrderNo = orderNo.trim().toUpperCase();
    const cleanPhone = phone.trim();

    if (!cleanOrderNo || !cleanPhone) {
      setError("Enter both your order number and the phone number used at checkout.");
      return;
    }

    setStatus("loading");
    setError("");
    setOrder(null);
    try {
      const response = await api.post("/orders/track", { orderNo: cleanOrderNo, phone: cleanPhone });
      setOrder(response.data);
      setStatus("done");
    } catch (requestError) {
      setStatus("idle");
      setError(
        requestError.status === 404
          ? "We could not find an order with that number and phone. Check both and try again, or contact support."
          : requestError.message || "The order could not be looked up. Please try again."
      );
    }
  }

  function reset() {
    setOrder(null);
    setOrderNo("");
    setPhone("");
    setError("");
    setStatus("idle");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[var(--color-muted)] sm:text-sm">
        <Link to="/" className="hover:text-[var(--color-primary-bright)]">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-semibold text-[var(--color-ink)]">Track order</span>
      </nav>

      <PageHeader
        eyebrow="Order status"
        title="Track your order"
        description="Enter the order number from your confirmation screen together with the phone number you used at checkout. We will show the latest status we have."
      />

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="track-order-no" className={LABEL_CLASS}>Order number</label>
            <input
              id="track-order-no"
              className={FIELD_CLASS}
              value={orderNo}
              onChange={(event) => {
                setOrderNo(event.target.value);
                if (error) setError("");
              }}
              placeholder="CV-ABC-DEFG"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck="false"
              maxLength={40}
              required
            />
          </div>
          <div>
            <label htmlFor="track-phone" className={LABEL_CLASS}>Phone number</label>
            <input
              id="track-phone"
              type="tel"
              className={FIELD_CLASS}
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                if (error) setError("");
              }}
              placeholder="Phone used at checkout"
              autoComplete="tel"
              maxLength={20}
              required
            />
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[var(--color-muted)]">
            Your order number was shown after checkout. It looks like <span className="font-semibold text-[var(--color-ink)]">CV-ABC-DEFG</span>.
          </p>
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {status === "loading" ? <PackageSearch className="h-4 w-4" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            {status === "loading" ? "Looking up..." : "Track order"}
          </button>
        </div>
      </form>

      {order ? (
        <>
          <OrderSummary order={order} />
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <button type="button" onClick={reset} className="font-semibold text-[var(--color-primary-bright)] hover:underline">
              Track another order
            </button>
            <Link to="/contact" className="text-[var(--color-muted)] hover:text-[var(--color-primary-bright)]">
              Something looks wrong
            </Link>
          </div>
        </>
      ) : null}

      <section className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="track-help-title">
        <h2 id="track-help-title" className="font-[var(--font-display)] text-base font-bold text-[var(--color-ink)]">
          Before you ask support
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[var(--color-muted)]">
          <li>Check that the phone number matches the one entered at checkout; a +91 prefix is fine.</li>
          <li>Order numbers use capital letters and digits, separated by dashes.</li>
          <li>Status updates appear after our team or the courier moves the order to the next step.</li>
        </ul>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Still stuck? <Link to="/contact" className="font-semibold text-[var(--color-primary-bright)] hover:underline">Contact support</Link>{" "}
          or read the <Link to="/shipping-delivery" className="font-semibold text-[var(--color-primary-bright)] hover:underline">shipping policy</Link>.
        </p>
      </section>
    </div>
  );
}
