import PolicyPage, { PolicyLink } from "../components/content/PolicyPage";

const UPDATED = "23 October 2026";
const UPDATED_ISO = "2026-10-23";

export default function RefundPolicy() {
  return (
    <PolicyPage
      title="Refund policy"
      summary="When a refund applies, how we pay it for Cash on Delivery orders, and how long it usually takes."
      updated={UPDATED}
      updatedISO={UPDATED_ISO}
      sections={[
        {
          heading: "When you are eligible for a refund",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>You cancelled the order before it was dispatched.</li>
              <li>You returned an item and the return was approved under the <PolicyLink to="/return-policy">return policy</PolicyLink>.</li>
              <li>An item arrived damaged, defective or incorrect and a replacement is not available.</li>
            </ul>
          ),
        },
        {
          heading: "How refunds are paid",
          body: (
            <>
              <p>
                Because orders are paid in cash on delivery, refunds are paid by bank transfer or UPI to
                account details you provide after the return is approved. We will ask for the account holder
                name, account number/UPI ID and IFSC where relevant, and will only use those details for this
                refund.
              </p>
              <p>
                We do not issue cash refunds at the doorstep. If online payments are added in the future,
                refunds for those payments will go back to the original payment method.
              </p>
            </>
          ),
        },
        {
          heading: "How long refunds take",
          body: (
            <p>
              Once a refund is approved, we aim to initiate it within 2 business days. Banks and UPI apps
              usually take another 5–7 business days to credit the amount. The exact time depends on your
              bank, and we will share a reference once the transfer is made.
            </p>
          ),
        },
        {
          heading: "Delivery fees",
          body: (
            <p>
              Delivery charges are refunded when the order is cancelled before dispatch or when the return is
              due to a damaged, defective or incorrect item. For change-of-mind returns, the original delivery
              fee is not refunded unless the law requires it. Any return costs are confirmed with you before
              you send the item back.
            </p>
          ),
        },
        {
          heading: "Cancellations",
          body: (
            <p>
              Cancel before dispatch and we refund the full amount, including any delivery fee, through the
              method above. Once an order is with the delivery partner it cannot be cancelled; you can refuse
              delivery or return the item after it arrives. See the{" "}
              <PolicyLink to="/return-policy">return policy</PolicyLink> for the return process.
            </p>
          ),
        },
        {
          heading: "Partial refunds",
          body: (
            <p>
              If a returned item is missing accessories, shows signs of use, or is damaged in a way that was
              not reported on delivery, we may offer a partial refund. We will explain the reason and the
              amount before processing it, and you can ask us to return the item instead.
            </p>
          ),
        },
        {
          heading: "Cash on Delivery orders",
          body: (
            <p>
              Nothing is charged before delivery, so there is no refund if an order is cancelled before it is
              paid for. If you paid the courier and later return an approved item, the amount you paid is
              refunded using the method above. If you refuse delivery, the order is returned to us and no
              refund is due.
            </p>
          ),
        },
        {
          heading: "If a refund is delayed",
          body: (
            <p>
              If the expected window has passed, contact us with your order number and the refund reference
              (if you have one). We will check the transfer with our bank and share the status. Please do not
              send account details by SMS or social media; use the{" "}
              <PolicyLink to="/contact">contact page</PolicyLink> or the email address our team confirms.
            </p>
          ),
        },
      ]}
    />
  );
}
