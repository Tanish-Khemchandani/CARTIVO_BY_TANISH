import PolicyPage, { PolicyLink } from "../components/content/PolicyPage";

const UPDATED = "23 October 2026";
const UPDATED_ISO = "2026-10-23";

export default function PrivacyPolicy() {
  return (
    <PolicyPage
      title="Privacy policy"
      summary="What CARTIVO collects when you browse or order, why we need it, and the choices you have over your information."
      updated={UPDATED}
      updatedISO={UPDATED_ISO}
      sections={[
        {
          heading: "Who we are",
          body: (
            <>
              <p>
                CARTIVO is an online store based in Vadodara, Gujarat, India. This policy explains how we
                handle personal information when you browse the storefront, place an order, create an
                account, save items to a wishlist or contact our support team.
              </p>
              <p>
                You can reach us about any privacy question through the <PolicyLink to="/contact">contact page</PolicyLink>.
              </p>
            </>
          ),
        },
        {
          heading: "Information we collect",
          body: (
            <>
              <p>We only collect what we need to run the store and fulfil your orders:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <span className="font-medium text-[var(--color-ink)]">Account details:</span> your name, email address and phone number when you create an account. Passwords are stored as salted hashes, never as plain text.
                </li>
                <li>
                  <span className="font-medium text-[var(--color-ink)]">Order details:</span> the items you buy, order totals, order status and the name, phone number and delivery address you provide at checkout.
                </li>
                <li>
                  <span className="font-medium text-[var(--color-ink)]">Wishlist:</span> products you save. Signed-out wishlists stay in your browser; signed-in wishlists are linked to your account.
                </li>
                <li>
                  <span className="font-medium text-[var(--color-ink)]">Support messages:</span> your name, email, phone number (if you share it) and the message you send us.
                </li>
                <li>
                  <span className="font-medium text-[var(--color-ink)]">Technical information:</span> standard server logs such as IP address, browser type and timestamps, used for security and troubleshooting.
                </li>
              </ul>
              <p>
                We do not receive or store card numbers, UPI credentials or other payment instrument details.
                Cash on Delivery is the only payment method available at the moment.
              </p>
            </>
          ),
        },
        {
          heading: "How we use your information",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>To accept and deliver orders, and to keep you informed about an order's status.</li>
              <li>To provide customer support and handle returns, refunds or delivery issues.</li>
              <li>To operate accounts and keep wishlists in sync across your devices.</li>
              <li>To prevent fraud, abuse and unauthorised access to admin tools.</li>
              <li>To understand how the store is used so we can fix problems and improve it.</li>
              <li>To meet legal, tax and accounting obligations.</li>
            </ul>
          ),
        },
        {
          heading: "Cookies and device storage",
          body: (
            <>
              <p>
                We use one essential cookie, <code className="rounded bg-white px-1.5 py-0.5 text-[13px]">cartivo_customer_session</code>,
                when you sign in to your account. It keeps you signed in for up to 30 days, is
                HTTP-only and is not readable by page scripts. Admin staff have a separate session cookie
                for the management area. Blocking cookies prevents account sign-in but browsing and guest
                checkout still work.
              </p>
              <p>
                Your cart, guest wishlist and light/dark theme choice are stored in your browser's local
                storage so they survive a page reload. They stay on your device unless you clear them or
                sign in and merge a wishlist into your account.
              </p>
              <p>
                We do not use advertising cookies, analytics scripts, tracking pixels or session-replay
                tools.
              </p>
            </>
          ),
        },
        {
          heading: "Who we share information with",
          body: (
            <>
              <p>We do not sell personal information. We share it only where it is needed to run the store:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <span className="font-medium text-[var(--color-ink)]">Delivery partners</span> receive the name, phone number and address required to deliver your order.
                </li>
                <li>
                  <span className="font-medium text-[var(--color-ink)]">Hosting and database providers</span> process store data on our behalf under their service terms.
                </li>
                <li>
                  <span className="font-medium text-[var(--color-ink)]">Authorities or advisers</span> may receive information where required by law, or where necessary to investigate fraud or protect our legal rights.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <>
              <p>
                Account details are kept while your account is open. Order records are kept for as long as
                needed for accounting, tax, warranty and return handling. Support messages are kept until
                the issue is resolved and for a reasonable period afterwards. Server logs are kept for a
                limited period for security and troubleshooting.
              </p>
              <p>
                When information is no longer needed, we delete it or remove the details that identify you.
              </p>
            </>
          ),
        },
        {
          heading: "How we protect it",
          body: (
            <>
              <p>
                The store is served over HTTPS in production. Sessions use HTTP-only cookies, passwords are
                hashed with a unique salt, and admin access is limited to authorised accounts. We share only
                the details a delivery partner needs.
              </p>
              <p>
                No online system can be completely secure. If you believe your account has been compromised,
                contact us immediately so we can end the session and help you secure it.
              </p>
            </>
          ),
        },
        {
          heading: "Your choices",
          body: (
            <>
              <p>You can ask us to:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>confirm what personal information we hold about you and provide a copy;</li>
                <li>correct information that is wrong or out of date;</li>
                <li>delete your account and the information linked to it;</li>
                <li>stop using your information for a purpose you previously agreed to.</li>
              </ul>
              <p>
                Send these requests through the <PolicyLink to="/contact">contact page</PolicyLink>. We may ask
                for proof of identity before acting, and we may need to keep certain order records where the
                law requires it.
              </p>
            </>
          ),
        },
        {
          heading: "Children",
          body: (
            <p>
              CARTIVO is intended for people aged 13 and over. We do not knowingly collect personal
              information from children under 13. If you believe a child has provided information to us,
              contact us and we will delete it.
            </p>
          ),
        },
        {
          heading: "Changes to this policy",
          body: (
            <p>
              If how we handle information changes, we will update this page and the date at the top.
              Significant changes will be highlighted on the storefront.
            </p>
          ),
        },
      ]}
    />
  );
}
