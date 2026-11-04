import PolicyPage, { PolicyLink } from "../components/content/PolicyPage";

const UPDATED = "23 October 2026";
const UPDATED_ISO = "2026-10-23";

export default function ShippingDelivery() {
  return (
    <PolicyPage
      title="Shipping & delivery"
      summary="Delivery charges, dispatch times and what to expect after you place a Cash on Delivery order with CARTIVO."
      updated={UPDATED}
      updatedISO={UPDATED_ISO}
      sections={[
        {
          heading: "Where we deliver",
          body: (
            <p>
              We deliver across India. The checkout will only accept a valid six-digit pincode, and our
              delivery partners cover most serviceable addresses. If a courier cannot reach your pincode,
              we will contact you using the phone number on the order to arrange an alternative or cancel
              it before dispatch.
            </p>
          ),
        },
        {
          heading: "Delivery charges",
          body: (
            <>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Delivery is free when the product subtotal is ₹499 or more.</li>
                <li>Orders below ₹499 have a flat delivery fee of ₹49.</li>
              </ul>
              <p>
                The exact charge is calculated by the store and shown in the order summary before you place
                the order. There are no hidden handling fees. The amount you see at checkout is the amount
                you pay in cash on delivery.
              </p>
            </>
          ),
        },
        {
          heading: "Dispatch times",
          body: (
            <p>
              We aim to pack and hand your order to our delivery partner within 1–2 business days of
              confirming it. Orders placed on Sundays or public holidays are usually processed on the next
              business day. If an item needs longer, we will contact you before dispatch.
            </p>
          ),
        },
        {
          heading: "Delivery times",
          body: (
            <p>
              Delivery typically takes 3–7 business days after dispatch. Remote pincodes and periods of
              heavy demand can take longer. Delivery timelines are estimates, not guarantees, because they
              depend on the courier and your location.
            </p>
          ),
        },
        {
          heading: "Cash on Delivery",
          body: (
            <>
              <p>
                Cash on Delivery is currently the only payment method. Pay the delivery partner in cash when
                the order arrives; please keep the exact amount ready. We do not collect card or UPI details
                online at this time.
              </p>
              <p>
                You can check the amount due on the confirmation screen and on the{" "}
                <PolicyLink to="/track-order">track order</PolicyLink> page.
              </p>
            </>
          ),
        },
        {
          heading: "Tracking your order",
          body: (
            <p>
              Open <PolicyLink to="/track-order">track your order</PolicyLink> and enter your order number
              together with the phone number used at checkout. You will see the current status, the items on
              the order and the amount due. Your order number appears on the confirmation screen immediately
              after checkout.
            </p>
          ),
        },
        {
          heading: "If delivery fails",
          body: (
            <p>
              Couriers usually attempt delivery more than once. If nobody is available, the order may be
              returned to us. Contact support with your order number and we will help you arrange
              re-delivery or cancel the order. Please keep your phone reachable on the delivery day.
            </p>
          ),
        },
        {
          heading: "Damaged, missing or wrong items",
          body: (
            <p>
              Report a damaged, missing or incorrect item within 48 hours of delivery with photos of the
              parcel and the item. We will arrange a replacement or refund where the issue is confirmed.
              See the <PolicyLink to="/return-policy">return policy</PolicyLink> and{" "}
              <PolicyLink to="/refund-policy">refund policy</PolicyLink> for the full process.
            </p>
          ),
        },
        {
          heading: "Contact us",
          body: (
            <p>
              For anything else about a delivery, use the <PolicyLink to="/contact">contact page</PolicyLink>{" "}
              and include your order number so we can look it up quickly.
            </p>
          ),
        },
      ]}
    />
  );
}
