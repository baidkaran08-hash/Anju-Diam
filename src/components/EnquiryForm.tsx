"use client";

import { useState } from "react";

type Fields = Record<string, string>;

const CATEGORIES = ["Rings", "Earrings", "Necklaces", "Bracelets", "A bespoke commission", "Not sure yet"];

export default function EnquiryForm() {
  const [values, setValues] = useState({ name: "", email: "", phone: "", category: CATEGORIES[0], message: "" });
  const [fields, setFields] = useState<Fields>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((previous) => ({ ...previous, [key]: event.target.value }));

  async function send() {
    setStatus("sending");
    setFields({});
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        setFields(data.fields ?? {});
        setMessage(data.error ?? "That did not send. Try again in a moment.");
        setStatus("error");
        return;
      }

      setMessage(
        `Thank you, ${values.name.split(" ")[0]}. Your enquiry is with the house — we reply within two business days.`,
      );
      setStatus("sent");
    } catch {
      setMessage("That did not send — check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="border-l-2 border-gold bg-gold/10 px-5 py-4 text-sm leading-relaxed text-plum" role="status">
        {message}
      </p>
    );
  }

  const inputClass =
    "border-0 border-b border-plum/25 bg-transparent py-3 text-[15px] font-light text-charcoal transition-colors focus:border-gold focus:outline-none";

  return (
    <div>
      {(
        [
          ["name", "Your name", "text"],
          ["email", "Email", "email"],
          ["phone", "Phone or WhatsApp (optional)", "tel"],
        ] as const
      ).map(([key, labelText, type]) => (
        <div key={key} className="mb-6 flex flex-col gap-2">
          <label htmlFor={`f-${key}`} className="label text-wine">
            {labelText}
          </label>
          <input
            id={`f-${key}`}
            type={type}
            value={values[key]}
            onChange={set(key)}
            aria-invalid={Boolean(fields[key])}
            className={inputClass}
          />
          {fields[key] && <span className="text-xs text-wine">{fields[key]}</span>}
        </div>
      ))}

      <div className="mb-6 flex flex-col gap-2">
        <label htmlFor="f-category" className="label text-wine">
          What are you looking for
        </label>
        <select id="f-category" value={values.category} onChange={set("category")} className={inputClass}>
          {CATEGORIES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <label htmlFor="f-message" className="label text-wine">
          Tell us more
        </label>
        <textarea
          id="f-message"
          rows={4}
          value={values.message}
          onChange={set("message")}
          placeholder="Occasion, budget range, a piece you already love…"
          className={`${inputClass} min-h-[88px] resize-y`}
        />
      </div>

      <button
        type="button"
        onClick={send}
        disabled={status === "sending"}
        className="label min-h-11 bg-plum px-10 py-4 text-ivory transition-colors hover:bg-wine disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send enquiry"}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-charcoal/70">
        We reply within two business days. Your details stay with the house — we never share them.
      </p>

      {status === "error" && (
        <p className="mt-4 border-l-2 border-wine bg-wine/10 px-5 py-4 text-sm text-plum" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
