"use client";

import { useState } from "react";

import { formatMoney } from "@/lib/money";

export type VariantRow = {
  id?: string;
  label: string;
  sku: string;
  /** Whole baht as typed, or "" for "same as the piece". */
  price: string;
  stock: string;
};

/** US half-sizes 4–10. Covers the overwhelming majority of what the house cuts. */
const RING_SIZES = [
  "US 4", "US 4.5", "US 5", "US 5.5", "US 6", "US 6.5", "US 7",
  "US 7.5", "US 8", "US 8.5", "US 9", "US 9.5", "US 10",
];

/**
 * The options a piece is offered in — ring sizes, chain lengths, metal colours.
 *
 * Unlike the gallery next door, this saves on an explicit button rather than on
 * every change. These are text fields, and persisting per keystroke would mean
 * a write for every letter of "US 6.5" and a half-typed label reaching the
 * storefront in between.
 *
 * A piece with no rows here is one-of-one, which is the house default — the
 * storefront then sells it on the product row alone with no selector at all.
 */
export default function VariantManager({
  productId,
  axis,
  currency,
  basePrice,
  variants,
  onChange,
}: {
  productId: string;
  axis: string;
  currency: string;
  basePrice: number;
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const label = axis || "Option";

  function update(next: VariantRow[]) {
    onChange(next);
    setDirty(true);
    setNote(null);
    setError(null);
  }

  const addRow = () => update([...variants, { label: "", sku: "", price: "", stock: "0" }]);

  const setField = (index: number, key: keyof VariantRow, value: string) =>
    update(variants.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  const remove = (index: number) => update(variants.filter((_, i) => i !== index));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= variants.length) return;
    const next = [...variants];
    [next[index], next[target]] = [next[target]!, next[index]!];
    update(next);
  };

  function addRingSizes() {
    const existing = new Set(variants.map((row) => row.label.trim().toLowerCase()));
    const additions = RING_SIZES.filter((size) => !existing.has(size.toLowerCase())).map((size) => ({
      label: size,
      sku: "",
      price: "",
      stock: "0",
    }));
    if (additions.length) update([...variants, ...additions]);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setNote(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          variants: variants
            // A row left completely blank is someone who clicked "Add" and
            // changed their mind, not a validation error to shout about.
            .filter((row) => row.label.trim() !== "")
            .map((row, index) => ({
              label: row.label.trim(),
              sku: row.sku.trim(),
              price: row.price.trim(),
              stock: Number(row.stock) || 0,
              position: index,
            })),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Those options did not save.");
        return;
      }

      // Adopt the server's rows so ids exist for anything just created.
      const saved: VariantRow[] = (payload.product?.variants ?? []).map(
        (variant: {
          id: string;
          label: string;
          sku: string | null;
          priceMinor: number | null;
          stock: number;
        }) => ({
          id: variant.id,
          label: variant.label,
          sku: variant.sku ?? "",
          price: variant.priceMinor == null ? "" : String(variant.priceMinor / 100),
          stock: String(variant.stock),
        }),
      );

      onChange(saved);
      setDirty(false);
      setNote(saved.length === 0 ? "Saved — this piece is one-of-one." : "Options saved.");
    } catch {
      setError("We could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const totalStock = variants.reduce((sum, row) => sum + (Number(row.stock) || 0), 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="label text-wine">Options</h2>
        {variants.length > 0 && (
          <span className="label-sm text-graphite/40">
            {variants.length} {variants.length === 1 ? "option" : "options"} · {totalStock} on hand
          </span>
        )}
      </div>

      {variants.length === 0 && (
        <p className="mb-5 text-xs font-light leading-relaxed text-graphite/55">
          None yet — this piece sells as one-of-one at its own price. Add options only if it
          comes in sizes or lengths a customer must choose between.
        </p>
      )}

      {variants.length > 0 && (
        <ul className="mb-5 space-y-3">
          {variants.map((row, index) => (
            <li
              key={row.id ?? `new-${index}`}
              className="grid grid-cols-[1fr_auto] gap-3 border border-graphite/12 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="block sm:col-span-2">
                  <span className="label-sm mb-1.5 block text-graphite/45">{label}</span>
                  <input
                    value={row.label}
                    onChange={(event) => setField(index, "label", event.target.value)}
                    placeholder="US 6"
                    className="field text-sm"
                  />
                </label>

                <label className="block">
                  <span className="label-sm mb-1.5 block text-graphite/45">Price</span>
                  <input
                    value={row.price}
                    onChange={(event) => setField(index, "price", event.target.value)}
                    inputMode="decimal"
                    placeholder="same"
                    title="Leave blank to charge the piece's own price."
                    className="field text-sm"
                  />
                </label>

                <label className="block">
                  <span className="label-sm mb-1.5 block text-graphite/45">On hand</span>
                  <input
                    value={row.stock}
                    onChange={(event) => setField(index, "stock", event.target.value)}
                    inputMode="numeric"
                    className="field text-sm"
                  />
                </label>

                <label className="block sm:col-span-4">
                  <span className="label-sm mb-1.5 block text-graphite/45">
                    Reference <span className="opacity-60">(optional)</span>
                  </span>
                  <input
                    value={row.sku}
                    onChange={(event) => setField(index, "sku", event.target.value)}
                    placeholder="AD-RING-0412-6"
                    className="field text-sm"
                  />
                </label>
              </div>

              <div className="flex flex-col justify-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${row.label || "this option"} up`}
                  className="h-7 w-7 text-graphite/40 transition-colors hover:text-plum disabled:opacity-25"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === variants.length - 1}
                  aria-label={`Move ${row.label || "this option"} down`}
                  className="h-7 w-7 text-graphite/40 transition-colors hover:text-plum disabled:opacity-25"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${row.label || "this option"}`}
                  className="h-7 w-7 text-graphite/35 transition-colors hover:text-[#B4485F]"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={addRow} className="btn-outline text-sm text-plum">
          Add an option
        </button>

        {label.toLowerCase().includes("ring size") && (
          <button
            type="button"
            onClick={addRingSizes}
            className="label-sm text-graphite/45 underline underline-offset-4 transition-colors hover:text-plum"
          >
            Add US 4–10
          </button>
        )}

        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="btn-gold ml-auto text-sm disabled:opacity-40"
        >
          {busy ? "Saving…" : dirty ? "Save options" : "Saved"}
        </button>
      </div>

      <p className="mt-4 text-xs font-light leading-relaxed text-graphite/50">
        A blank price charges the piece&rsquo;s own —{" "}
        {formatMoney(basePrice, currency)}. &ldquo;On hand&rdquo; is ignored while the piece is
        made to order.
      </p>

      <div aria-live="polite" className="min-h-5">
        {error && (
          <p className="mt-3 text-xs text-[#B4485F]" role="alert">
            {error}
          </p>
        )}
        {note && <p className="mt-3 text-xs font-light text-graphite/55">{note}</p>}
      </div>
    </div>
  );
}
