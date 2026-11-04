import { Link } from "react-router-dom";
import { Heart, MapPin, Package, User as UserIcon } from "lucide-react";
import AccountShell from "../components/account/AccountShell";
import { useAuth } from "../context/AuthContext";

/* Account overview. The session guard and tabs live in AccountShell. */
const CARDS = [
  {
    to: "/account/orders",
    icon: Package,
    title: "My orders",
    note: "Track and review past purchases.",
  },
  {
    to: "/account/addresses",
    icon: MapPin,
    title: "Saved addresses",
    note: "Keep delivery details ready for checkout.",
  },
  {
    to: "/account/profile",
    icon: UserIcon,
    title: "Profile",
    note: "Update your name, phone and password.",
  },
  {
    to: "/wishlist",
    icon: Heart,
    title: "My wishlist",
    note: "Saved products, move to cart any time.",
  },
];

export default function Account() {
  const { user } = useAuth();

  return (
    <AccountShell
      title={user ? `Hello, ${user.name}` : "My account"}
      description={user?.email ? `Signed in as ${user.email}` : undefined}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group flex items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5 transition hover:border-[var(--color-primary-bright)] hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
              <card.icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--color-ink)]">{card.title}</span>
              <span className="mt-0.5 block text-xs text-[var(--color-muted)]">{card.note}</span>
            </span>
          </Link>
        ))}
      </div>
    </AccountShell>
  );
}
