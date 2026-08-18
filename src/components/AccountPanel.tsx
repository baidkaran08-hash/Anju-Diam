"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/components/CartProvider";
import { Price } from "@/components/CurrencyProvider";
import { orderStatusLabel, type OrderStatus } from "@/lib/enums";

type SessionUser = { id: string; email: string; name: string; role: string } | null;

type Order = {
  id: string;
  reference: string;
  status: string;
  totalMinor: number;
  currency: string;
  createdAt: string;
  items: { id: string; quantity: number; product: { name: string; slug: string } }[];
};

export default function AccountPanel({
  user,
  orders,
}: {
  user: SessionUser;
  orders: Order[];
}) {
  const router = useRouter();
  const { refresh } = useCart();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(payload.fields ?? {});
        setFormError(payload.error ?? "That did not work. Please try again.");
        return;
      }

      // Signing in merges the guest cart and wishlist, so both need re-reading.
      await refresh();
      router.refresh();
    } catch {
      setFormError("We could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.refresh();
    setBusy(false);
  }

  // ── Signed out ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="grid gap-16 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-10 flex gap-8 border-b border-graphite/12">
            {(["login", "register"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMode(option);
                  setErrors({});
                  setFormError(null);
                }}
                aria-pressed={mode === option}
                className={`label -mb-px border-b pb-4 transition-colors ${
                  mode === option
                    ? "border-gold text-plum"
                    : "border-transparent text-graphite/40 hover:text-plum"
                }`}
              >
                {option === "login" ? "Sign in" : "Create an account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} noValidate className="grid gap-8">
            {mode === "register" && (
              <label className="block">
                <span className="label-sm mb-1 block text-graphite/45">Your name</span>
                <input name="name" required autoComplete="name" className="field" />
                {errors.name && <Err>{errors.name}</Err>}
              </label>
            )}

            <label className="block">
              <span className="label-sm mb-1 block text-graphite/45">Email</span>
              <input name="email" type="email" required autoComplete="email" className="field" />
              {errors.email && <Err>{errors.email}</Err>}
            </label>

            {mode === "register" && (
              <label className="block">
                <span className="label-sm mb-1 block text-graphite/45">
                  Telephone <span className="opacity-60">(optional)</span>
                </span>
                <input name="phone" type="tel" autoComplete="tel" className="field" />
                {errors.phone && <Err>{errors.phone}</Err>}
              </label>
            )}

            <label className="block">
              <span className="label-sm mb-1 block text-graphite/45">Password</span>
              <input
                name="password"
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="field"
              />
              {errors.password && <Err>{errors.password}</Err>}
              {mode === "register" && (
                <span className="mt-2 block text-xs font-light text-graphite/45">
                  At least 10 characters.
                </span>
              )}
            </label>

            {formError && (
              <p className="text-sm text-[#B4485F]" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-gold justify-self-start">
              {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <aside className="border border-graphite/15 bg-stone/25 p-9 md:p-12">
          <h2 className="display-sm text-plum">Why hold an account?</h2>
          <ul className="mt-8 space-y-5 text-sm font-light leading-relaxed text-graphite/70">
            <li>Your saved pieces and selection follow you between devices.</li>
            <li>Every enquiry and commission in one place, with its reference.</li>
            <li>Sizing and preferences kept on file, so a repeat order is a sentence.</li>
          </ul>
          <p className="mt-9 text-xs font-light leading-relaxed text-graphite/50">
            Anything you have already saved as a guest will be carried across when you sign in.
          </p>
        </aside>
      </div>
    );
  }

  // ── Signed in ──────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-graphite/12 pb-8">
        <div>
          <p className="label mb-3 text-wine">Signed in</p>
          <p className="display-sm text-plum">{user.name}</p>
          <p className="mt-2 text-sm font-light text-graphite/55">{user.email}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          {user.role === "ADMIN" && (
            <Link href="/admin" className="btn-outline text-plum">
              Studio
            </Link>
          )}
          <button type="button" onClick={signOut} disabled={busy} className="btn-outline text-plum">
            Sign out
          </button>
        </div>
      </div>

      <h2 className="label mb-8 mt-14 text-wine">Your enquiries</h2>

      {orders.length === 0 ? (
        <div className="border border-graphite/12 py-20 text-center">
          <p className="display-sm text-plum">Nothing here yet.</p>
          <p className="measure mx-auto mt-4 text-sm text-graphite/60">
            When you send a selection to the house it will appear here with its reference.
          </p>
          <Link href="/collections" className="btn-gold mt-9 inline-flex">
            Browse the collections
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-graphite/12 border-y border-graphite/12">
          {orders.map((order) => (
            <li key={order.id} className="py-7">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="label text-plum">{order.reference}</p>
                  <p className="mt-2 text-xs font-light text-graphite/45">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <Price minor={order.totalMinor} className="block text-sm tabular-nums" />
                  <p className="label-sm mt-2 text-gold">
                    {orderStatusLabel[order.status as OrderStatus] ?? order.status}
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-1.5">
                {order.items.map((item) => (
                  <li key={item.id} className="text-sm font-light text-graphite/65">
                    <Link href={`/products/${item.product.slug}`} className="hover:text-plum">
                      {item.product.name}
                    </Link>
                    {item.quantity > 1 && <span className="text-graphite/40"> × {item.quantity}</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-2 block text-xs text-[#B4485F]" role="alert">
      {children}
    </span>
  );
}
