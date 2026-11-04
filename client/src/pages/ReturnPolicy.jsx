import PolicyPage, { PolicyLink } from "../components/content/PolicyPage";

const UPDATED = "23 October 2026";
const UPDATED_ISO = "2026-10-23";

export default function ReturnPolicy() {
  return (
    <PolicyPage
      title="Return policy"
      summary="How to return an item within 7 days of delivery, what we can accept, and how damaged or incorrect orders are handled."
      updated={UPDATED}
      updatedISO={UPDATED_ISO}
      sections={[
        {
          heading: "Return window",
          body: (
            <p>
              You can request a return within 7 days of delivery. The request must reach us before the
              7-day window ends, and the item must meet the eligibility rules below. Returns requested after
              the window are not accepted unless the item arrived damaged, was the wrong item, or is covered
              by a manufacturer warranty.
            </p>
          ),
        },
        {
          heading: "Items that can be returned",
          body: (
            <>
              <p>To be accepted, an item must be:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>unused, unwashed and in the same condition you received it;</li>
                <li>in its original packaging with tags, seals, manuals and accessories intact;</li>
                <li>accompanied by the order number and, where possible, the invoice or packing slip.</li>
              </ul>
              <p>
                Some categories (for example fashion and electronics) may have additional checks. We will
                tell you what applies before you send the item back.
              </p>
            </>
          ),
        },
        {
          heading: "Items we cannot accept",
          body: (
            <>
              <p>
                For hygiene, safety and legal reasons, we cannot accept returns of:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>opened personal-care, beauty or cosmetic products;</li>
                <li>innerwear and other intimate apparel;</li>
                <li>perishable groceries and food items;</li>
                <li>digital products, gift cards and downloadable content;</li>
                <li>items that have been used, installed, altered or damaged after delivery.</li>
              </ul>
              <p>
                These exclusions do not apply when the item arrived damaged, defective or different from what
                you ordered. In those cases, report the problem under the section below.
              </p>
            </>
          ),
        },
        {
          heading: "Damaged, wrong or missing items",
          body: (
            <p>
              Report a damaged, defective, wrong or missing item within 48 hours of delivery. Include your
              order number, photos of the parcel and the item, and a short description of the problem. We
              will arrange a replacement, a return or a refund once the issue is confirmed. Please keep the
              packaging until the case is closed.
            </p>
          ),
        },
        {
          heading: "How to start a return",
          body: (
            <>
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Contact us through the <PolicyLink to="/contact">contact page</PolicyLink> with your order number, phone number, item and reason.</li>
                <li>We will confirm whether the item is eligible and explain the next step.</li>
                <li>We will tell you whether a pickup can be arranged or whether to send the item back, and confirm any costs with you before anything is shipped.</li>
                <li>Pack the item securely with all original contents and include the order number inside the parcel.</li>
              </ol>
              <p>
                Please do not send an item back before we confirm the return, because unannounced returns can
                be refused or lost in transit.
              </p>
            </>
          ),
        },
        {
          heading: "Inspection and approval",
          body: (
            <p>
              Once the item reaches us, we inspect it against the eligibility rules. If it passes, we approve
              the return and start the refund or exchange. If it does not pass, we will explain why and
              arrange to send it back to you.
            </p>
          ),
        },
        {
          heading: "Exchanges",
          body: (
            <p>
              Exchanges are subject to stock availability. If the replacement you want is unavailable, you
              can choose a refund instead. We will confirm the available options when we approve the return.
            </p>
          ),
        },
        {
          heading: "Order cancellations",
          body: (
            <p>
              You can cancel an order before it is dispatched by contacting us with the order number. Once
              an order has been handed to the delivery partner, it cannot be cancelled; you can refuse
              delivery or request a return after it arrives. See the{" "}
              <PolicyLink to="/refund-policy">refund policy</PolicyLink> for how cancellations are refunded.
            </p>
          ),
        },
        {
          heading: "Refunds",
          body: (
            <p>
              Approved returns are refunded according to the <PolicyLink to="/refund-policy">refund policy</PolicyLink>.
              Delivery charges are handled as described there.
            </p>
          ),
        },
      ]}
    />
  );
}
