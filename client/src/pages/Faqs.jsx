import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageCircle } from "lucide-react";
import PageHeader from "../components/content/PageHeader";

const linkClass = "font-medium text-[var(--color-primary-bright)] underline-offset-2 hover:underline";

const groups = [
  {
    title: "Orders and delivery",
    items: [
      {
        q: "How do I place an order?",
        a: (
          <p>
            Browse the collection, open a product and choose <span className="font-medium text-[var(--color-ink)]">Add to cart</span>.
            When you are ready, open the cart, review the total and continue to checkout. Enter your name,
            phone number and delivery address, then place the order. The order number appears on the
            confirmation screen — keep it for tracking or support.
          </p>
        ),
      },
      {
        q: "What are the delivery charges?",
        a: (
          <p>
            Delivery is free when the product subtotal is ₹499 or more. Below that, a flat fee of ₹49
            applies. The exact charge is shown in the order summary before you place the order. See the{" "}
            <Link to="/shipping-delivery" className={linkClass}>shipping &amp; delivery policy</Link>.
          </p>
        ),
      },
      {
        q: "How long will my order take?",
        a: (
          <p>
            We aim to dispatch within 1–2 business days. Delivery usually takes another 3–7 business days,
            depending on your pincode. Remote areas and busy periods can take longer; the courier handles the
            final leg after dispatch.
          </p>
        ),
      },
      {
        q: "How do I track my order?",
        a: (
          <p>
            Use the <Link to="/track-order" className={linkClass}>track your order</Link> page with your order
            number and the phone number entered at checkout. It shows the current status and the amount due.
          </p>
        ),
      },
      {
        q: "Can I change my address or phone number after ordering?",
        a: (
          <p>
            Contact us as soon as possible. If the order has not been dispatched, we can usually update the
            delivery details. Once it is with the courier, changes may not be possible and the order may need
            to be returned and re-ordered.
          </p>
        ),
      },
      {
        q: "What happens if I miss the delivery?",
        a: (
          <p>
            Couriers usually try again. Keep your phone reachable around the delivery date. If the order is
            returned to us, contact support with the order number and we will help you arrange re-delivery or
            cancel it.
          </p>
        ),
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: (
          <p>
            Cash on Delivery is the only method available right now. Pay the courier in cash when the order
            arrives. Online card and UPI payments are not available yet.
          </p>
        ),
      },
      {
        q: "Do I pay anything before delivery?",
        a: (
          <p>
            No. You pay only when the order is delivered. The amount shown at checkout is the full amount due,
            including any delivery fee.
          </p>
        ),
      },
      {
        q: "Are my payment details stored?",
        a: (
          <p>
            No payment instrument details are collected online because orders are paid in cash on delivery.
            Our accounts store your order and delivery details, not card or UPI credentials.
          </p>
        ),
      },
    ],
  },
  {
    title: "Returns and refunds",
    items: [
      {
        q: "What is the return window?",
        a: (
          <p>
            You can request a return within 7 days of delivery. Items must be unused, unwashed and complete
            with their original packaging, tags and accessories. Full rules are in the{" "}
            <Link to="/return-policy" className={linkClass}>return policy</Link>.
          </p>
        ),
      },
      {
        q: "How do I start a return?",
        a: (
          <p>
            Send us a message through the <Link to="/contact" className={linkClass}>contact page</Link> with
            your order number, the item and the reason. We will confirm whether it is eligible and explain
            whether to send it back or whether a pickup can be arranged. Please wait for our confirmation
            before shipping anything.
          </p>
        ),
      },
      {
        q: "When will I receive my refund?",
        a: (
          <p>
            Once a return is approved, we aim to initiate the refund within 2 business days. Bank transfers
            and UPI refunds usually take another 5–7 business days to appear. See the{" "}
            <Link to="/refund-policy" className={linkClass}>refund policy</Link> for details.
          </p>
        ),
      },
      {
        q: "Can I exchange an item?",
        a: (
          <p>
            Exchanges depend on stock. Tell us which item you want instead when you contact us, and we will
            confirm availability. If the replacement is unavailable, you can choose a refund instead.
          </p>
        ),
      },
      {
        q: "Can I cancel my order?",
        a: (
          <p>
            Yes, before it is dispatched. Contact us with the order number and we will cancel it. Once the
            courier has the parcel it cannot be cancelled; you can refuse delivery or return the item after it
            arrives.
          </p>
        ),
      },
    ],
  },
  {
    title: "Accounts and wishlists",
    items: [
      {
        q: "Do I need an account to order?",
        a: (
          <p>
            No. You can check out as a guest using your delivery details. An account keeps your wishlist in
            sync across devices and makes it easier to find your details next time.
          </p>
        ),
      },
      {
        q: "How does the wishlist work?",
        a: (
          <p>
            Signed out, the wishlist is saved in this browser only. After you sign in, those saved items merge
            into your account and stay available on other devices.
          </p>
        ),
      },
      {
        q: "How do I delete my account or my data?",
        a: (
          <p>
            Contact us through the <Link to="/contact" className={linkClass}>contact page</Link> and we will
            help. Some order records may need to be kept for accounting and legal reasons; the{" "}
            <Link to="/privacy-policy" className={linkClass}>privacy policy</Link> explains this.
          </p>
        ),
      },
    ],
  },
  {
    title: "Products",
    items: [
      {
        q: "How do I know an item is in stock?",
        a: (
          <p>
            The product page shows the current stock status. The checkout checks availability again before
            placing the order, so two shoppers cannot buy the last unit at the same time.
          </p>
        ),
      },
      {
        q: "Can I order in bulk?",
        a: (
          <p>
            The store accepts quantities up to the stock available for each item. For a larger requirement,
            contact support with the product and quantity and we will let you know what is possible.
          </p>
        ),
      },
    ],
  },
];

export default function Faqs() {
  useEffect(() => {
    document.title = "FAQs | CARTIVO";
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[var(--color-muted)] sm:text-sm">
        <Link to="/" className="hover:text-[var(--color-primary-bright)]">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-semibold text-[var(--color-ink)]">FAQs</span>
      </nav>

      <PageHeader
        eyebrow="Help centre"
        title="Frequently asked questions"
        description="Straight answers about ordering, delivery, payments, returns and your account. If your question is not here, contact our support team."
      />

      <div className="mt-8 space-y-6">
        {groups.map((group) => (
          <section key={group.title} className="rounded-2xl border border-[var(--color-border)] bg-white" aria-labelledby={"faq-" + group.title.replace(/\s+/g, "-").toLowerCase()}>
            <h2
              id={"faq-" + group.title.replace(/\s+/g, "-").toLowerCase()}
              className="border-b border-[var(--color-border)] px-4 py-4 font-[var(--font-display)] text-base font-bold text-[var(--color-ink)] sm:px-5"
            >
              {group.title}
            </h2>
            <div className="px-4 sm:px-5">
              {group.items.map((item) => (
                <details key={item.q} className="group border-b border-[var(--color-border)] last:border-b-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-semibold text-[var(--color-ink)] marker:hidden [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-faint)] transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="pb-4 pr-6 text-sm leading-6 text-[var(--color-muted)]">{item.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-primary-bright)]">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-[var(--font-display)] text-base font-bold text-[var(--color-ink)]">
              Still need help?
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Send us the order number and what went wrong, and we will look into it.
            </p>
            <Link
              to="/contact"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-bright)] hover:underline"
            >
              Contact support
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
