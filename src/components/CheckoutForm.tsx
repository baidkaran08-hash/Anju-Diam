"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "@/components/CartProvider";
import { DiamondRule } from "@/components/Logo";
import { Price, ConversionNote } from "@/components/CurrencyProvider";

/**
 * Enquiry checkout.
 *
 * No payment step: at this price point, and with everything made to order, the
 * house confirms stones and sizing before taking money. The form captures
 * everything the atelier needs to quote and nothing it does not.
 */
export default function CheckoutForm() {
  const router = useRouter();
  const { items, count, subtotalMinor, currency, ready, refresh } = useCart();

  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  // An empty selection has nothing to check out — send them back to browse.
  useEffect(() => {
    if (ready && count === 0 && state === "idle") router.replace("/cart");
  }, [ready, count, state, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setErrors({});
    setFormError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(payload.fields ?? {});
        setFormError(payload.error ?? "We could not submit that. Please try again.");
        setState("idle");
        return;
      }

      setReference(payload.reference ?? null);
      setState("done");
      await refresh();
    } catch {
      setFormError("We could not reach the server. Please check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="border border-gold/30 bg-stone/25 px-8 py-20 text-center md:px-16">
        <DiamondRule className="mx-auto h-3 w-40 text-gold" />
        <h2 className="display-lg mt-10 text-plum">Thank you.</h2>
        <p className="measure mx-auto mt-6 body-lg text-graphite/70">
          Your selection is with the house. We will confirm stone availability and final sizing with
          you, then send a firm quotation — usually within one business day.
        </p>
        {reference && <p className="label mt-10 text-wine">Reference {reference}</p>}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link href="/collections" className="btn-gold">
            Continue browsing
          </Link>
          <Link href="/account" className="btn-outline text-plum">
            View my enquiries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-14 lg:grid-cols-[1.5fr_1fr]">
      <div>
        {/* Honeypot */}
        <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
          <label>
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <fieldset>
          <legend className="label mb-8 text-wine">Your details</legend>
          <div className="grid gap-8 sm:grid-cols-2">
            <Field name="customerName" label="Full name" autoComplete="name" error={errors.customerName} required />
            <Field name="customerEmail" label="Email" type="email" autoComplete="email" error={errors.customerEmail} required />
            <Field name="customerPhone" label="Telephone" type="tel" autoComplete="tel" error={errors.customerPhone} optional />
          </div>
        </fieldset>

        <fieldset className="mt-14">
          <legend className="label mb-8 text-wine">Delivery</legend>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field name="shippingLine1" label="Address" autoComplete="address-line1" error={errors.shippingLine1} required />
            </div>
            <Field name="shippingCity" label="City" autoComplete="address-level2" error={errors.shippingCity} required />
            <Field name="shippingPost" label="Postcode" autoComplete="postal-code" error={errors.shippingPost} required />
            <div className="sm:col-span-2">
              <Field name="shippingCountry" label="Country" autoComplete="country-name" defaultValue="Thailand" error={errors.shippingCountry} required />
            </div>
          </div>
        </fieldset>

        <fieldset className="mt-14">
          <legend className="label mb-8 text-wine">Anything else</legend>
          <label className="block">
            <span className="label-sm mb-1 block text-graphite/45">
              Notes for the atelier <span className="opacity-60">(optional)</span>
            </span>
            <textarea
              name="message"
              rows={4}
              className="field resize-none"
              placeholder="Sizes, a date you need it by, an occasion we should know about."
            />
          </label>
        </fieldset>

        {formError && (
          <p className="mt-8 text-sm text-[#B4485F]" role="alert">
            {formError}
          </p>
        )}
      </div>

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="glass-light glass-r p-8 md:p-10">
          <h2 className="label mb-8 text-wine">Your selection</h2>

          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-5 text-sm font-light">
                <span className="min-w-0">
                  {item.name}
                  {item.quantity > 1 && <span className="text-graphite/45"> × {item.quantity}</span>}
                  {item.note && (
                    <span className="mt-1 block text-xs italic text-graphite/45">{item.note}</span>
                  )}
                </span>
                <Price minor={item.priceMinor * item.quantity} className="shrink-0 tabular-nums" />
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-baseline justify-between gap-5 border-t border-graphite/15 pt-6">
            <span className="label text-plum">Indicative</span>
            <Price minor={subtotalMinor} className="text-xl font-light tabular-nums text-plum" />
          </div>

          <button type="submit" disabled={state === "sending"} className="btn-gold mt-9 w-full">
            {state === "sending" ? "Sending…" : "Send to the house"}
          </button>

          <ConversionNote className="mt-6 text-graphite/55" />

          <p className="mt-4 text-xs font-light leading-relaxed text-graphite/55">
            This is an enquiry, not a purchase. No card is taken and nothing is charged. We will
            come back with a firm quotation before anything is made.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  error,
  required = false,
  optional = false,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="label-sm mb-1 block text-graphite/45">
        {label} {optional && <span className="opacity-60">(optional)</span>}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        className="field"
      />
      {error && (
        <span className="mt-2 block text-xs text-[#B4485F]" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
