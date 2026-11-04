import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import PageHeader from "../components/content/PageHeader";
import useSettings from "../hooks/useSettings";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const FIELD_CLASS =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-bright)] focus:ring-2 focus:ring-[var(--color-primary-bright)]/15";
const LABEL_CLASS = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = { name: "", email: "", phone: "", message: "" };

export default function Contact() {
  const settings = useSettings();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Contact us | CARTIVO";
  }, []);

  // If someone is signed in, start from the details we already know and let
  // them edit anything.
  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: current.name || user.name || "",
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      if (error) setError("");
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setError("Please add your name, email address and message.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address so we can reply.");
      return;
    }
    if (message.length > 2000) {
      setError("Please keep your message under 2000 characters.");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      await api.post("/contact", { name, email, phone, message });
      setStatus("sent");
      setForm((current) => ({ ...EMPTY_FORM, name: current.name, email: current.email, phone: current.phone }));
    } catch (requestError) {
      setStatus("idle");
      setError(requestError.message || "Your message could not be sent. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[var(--color-muted)] sm:text-sm">
        <Link to="/" className="hover:text-[var(--color-primary-bright)]">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-semibold text-[var(--color-ink)]">Contact us</span>
      </nav>

      <PageHeader
        eyebrow="Contact us"
        title="How can we help?"
        description="Questions about an order, a return or a product? Send us a message with your order number if you have one, and our support team will get back to you."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-8">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="contact-details-title">
            <h2 id="contact-details-title" className="font-[var(--font-display)] text-base font-bold text-[var(--color-ink)]">
              Support details
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              We usually reply within two business days.
            </p>
            <ul className="mt-4 space-y-3.5 text-sm text-[var(--color-muted)]">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-primary-bright)]" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Email</span>
                  <a href={"mailto:" + settings.contactEmail} className="mt-0.5 block break-all hover:text-[var(--color-primary-bright)]">
                    {settings.contactEmail}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-primary-bright)]" aria-hidden="true" />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Phone</span>
                  <a href={"tel:" + settings.contactPhone} className="mt-0.5 block hover:text-[var(--color-primary-bright)]">
                    {settings.contactPhone}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-primary-bright)]" aria-hidden="true" />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Address</span>
                  <span className="mt-0.5 block">{settings.address}</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-primary-bright)]" aria-hidden="true" />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Support hours</span>
                  <span className="mt-0.5 block">{settings.supportHours}</span>
                </span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6" aria-labelledby="contact-quick-title">
            <h2 id="contact-quick-title" className="font-[var(--font-display)] text-base font-bold text-[var(--color-ink)]">
              Quick links
            </h2>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <Link to="/track-order" className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 text-[var(--color-muted)] transition hover:text-[var(--color-primary-bright)]">
                  Track an order <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 text-[var(--color-muted)] transition hover:text-[var(--color-primary-bright)]">
                  Read the FAQs <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 text-[var(--color-muted)] transition hover:text-[var(--color-primary-bright)]">
                  Return policy <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6 lg:p-7" aria-labelledby="contact-form-title">
          {status === "sent" ? (
            <div className="flex h-full min-h-72 flex-col items-center justify-center py-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[var(--color-success)]">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-[var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
                Message sent
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
                Thanks for getting in touch. We have your message and will reply to the email address you
                provided, usually within two business days.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
                >
                  Send another message
                </button>
                <Link
                  to="/products"
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 id="contact-form-title" className="font-[var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
                Send a message
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Fields marked with <span aria-hidden="true">*</span> are required.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2" noValidate>
                <div>
                  <label htmlFor="contact-name" className={LABEL_CLASS}>
                    Your name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-name"
                    className={FIELD_CLASS}
                    value={form.name}
                    onChange={update("name")}
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className={LABEL_CLASS}>
                    Email <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className={FIELD_CLASS}
                    value={form.email}
                    onChange={update("email")}
                    maxLength={254}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="contact-phone" className={LABEL_CLASS}>
                    Phone <span className="font-normal normal-case text-[var(--color-faint)]">(optional)</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    className={FIELD_CLASS}
                    value={form.phone}
                    onChange={update("phone")}
                    maxLength={30}
                    autoComplete="tel"
                    placeholder="Include this if your question is about an order"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="contact-message" className={LABEL_CLASS}>
                      Message <span aria-hidden="true">*</span>
                    </label>
                    <span className="mb-1.5 text-[11px] text-[var(--color-faint)]">{form.message.length}/2000</span>
                  </div>
                  <textarea
                    id="contact-message"
                    className={FIELD_CLASS}
                    value={form.message}
                    onChange={update("message")}
                    rows={6}
                    maxLength={2000}
                    placeholder="Tell us what you need help with. For order questions, include your order number."
                    required
                  />
                </div>

                {error ? (
                  <p role="alert" className="sm:col-span-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </p>
                ) : null}

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {status === "sending" ? "Sending..." : "Send message"}
                  </button>
                  <p className="mt-3 text-xs leading-5 text-[var(--color-faint)]">
                    By sending this message you agree that we may use your details to reply. Read our{" "}
                    <Link to="/privacy-policy" className="font-medium text-[var(--color-primary-bright)] hover:underline">
                      privacy policy
                    </Link>.
                  </p>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-[var(--color-faint)]">
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        For urgent delivery issues, call the support number above during support hours.
      </p>
    </div>
  );
}
