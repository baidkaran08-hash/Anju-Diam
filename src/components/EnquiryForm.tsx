"use client";

import { useState } from "react";

import { categories } from "@/lib/site";
import { DiamondRule } from "@/components/Logo";
import type { EnquiryKind } from "@/lib/enums";

type Props = {
  kind?: EnquiryKind;
  /** Pre-fills "Regarding" — a category name or a piece the visitor is viewing. */
  subject?: string;
  showBudget?: boolean;
  showCategory?: boolean;
  tone?: "light" | "dark";
  heading?: string;
};

export default function EnquiryForm({
  kind = "CONTACT",
  subject,
  showBudget = false,
  showCategory = false,
  tone = "light",
  heading,
}: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const dark = tone === "dark";
  const fieldClass = `field ${dark ? "text-ivory placeholder:text-ivory/35" : "text-graphite"}`;
  const labelClass = `label-sm mb-1 block ${dark ? "text-ivory/45" : "text-graphite/45"}`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setErrors({});
    setFormError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, kind }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(payload.fields ?? {});
        setFormError(payload.error ?? "We could not send that. Please try again.");
        setState("idle");
        return;
      }

      setReference(payload.reference ?? null);
      setState("sent");
    } catch {
      setFormError("We could not reach the server. Please check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className={`py-10 ${dark ? "text-ivory" : "text-plum"}`} role="status" aria-live="polite">
        <DiamondRule className="h-3 w-32 text-gold" />
        <h3 className="display-md mt-8">Thank you.</h3>
        <p className={`measure mt-5 body-lg ${dark ? "text-ivory/65" : "text-graphite/70"}`}>
          Your enquiry is with the house. A member of our team will respond personally within one
          business day.
        </p>
        {reference && (
          <p className={`label-sm mt-6 ${dark ? "text-ivory/40" : "text-graphite/40"}`}>
            Reference {reference}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={dark ? "text-ivory" : "text-graphite"}>
      {heading && <h3 className={`display-md mb-10 ${dark ? "text-ivory" : "text-plum"}`}>{heading}</h3>}

      {/* Honeypot — off-screen, not display:none, so bots still fill it. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="enq-name">
            Your name
          </label>
          <input id="enq-name" name="name" required autoComplete="name" className={fieldClass} />
          {errors.name && <Error dark={dark}>{errors.name}</Error>}
        </div>

        <div>
          <label className={labelClass} htmlFor="enq-email">
            Email
          </label>
          <input id="enq-email" name="email" type="email" required autoComplete="email" className={fieldClass} />
          {errors.email && <Error dark={dark}>{errors.email}</Error>}
        </div>

        <div>
          <label className={labelClass} htmlFor="enq-phone">
            Telephone <span className="opacity-50">(optional)</span>
          </label>
          <input id="enq-phone" name="phone" type="tel" autoComplete="tel" className={fieldClass} />
          {errors.phone && <Error dark={dark}>{errors.phone}</Error>}
        </div>

        {showCategory ? (
          <div>
            <label className={labelClass} htmlFor="enq-subject">
              Interested in
            </label>
            <select id="enq-subject" name="subject" defaultValue={subject ?? ""} className={fieldClass}>
              <option value="">Select a collection</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.name} className="text-graphite">
                  {category.name}
                </option>
              ))}
              <option value="Bespoke" className="text-graphite">
                Something bespoke
              </option>
            </select>
          </div>
        ) : (
          <input type="hidden" name="subject" value={subject ?? ""} />
        )}

        {showBudget && (
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="enq-budget">
              Budget <span className="opacity-50">(optional)</span>
            </label>
            <select id="enq-budget" name="budget" defaultValue="" className={fieldClass}>
              <option value="">Prefer not to say</option>
              {["Under ฿50,000", "฿50,000 – ฿150,000", "฿150,000 – ฿400,000", "฿400,000 – ฿1,000,000", "Above ฿1,000,000"].map(
                (band) => (
                  <option key={band} value={band} className="text-graphite">
                    {band}
                  </option>
                ),
              )}
            </select>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="enq-message">
            How can we help?
          </label>
          <textarea
            id="enq-message"
            name="message"
            required
            rows={4}
            className={`${fieldClass} resize-none`}
            placeholder="Tell us about the piece you have in mind — the occasion, the stone, the hand it is for."
          />
          {errors.message && <Error dark={dark}>{errors.message}</Error>}
        </div>
      </div>

      {formError && (
        <p className="mt-6 text-sm text-[#B4485F]" role="alert">
          {formError}
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <button type="submit" disabled={state === "sending"} className="btn-gold">
          {state === "sending" ? "Sending…" : "Send enquiry"}
        </button>
        <p className={`text-xs font-light ${dark ? "text-ivory/40" : "text-graphite/45"}`}>
          We reply within one business day.
        </p>
      </div>
    </form>
  );
}

function Error({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <p className={`mt-2 text-xs ${dark ? "text-[#E8A0AF]" : "text-[#B4485F]"}`} role="alert">
      {children}
    </p>
  );
}
