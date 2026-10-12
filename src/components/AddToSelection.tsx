"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/CartProvider";
import { Price } from "@/components/CurrencyProvider";
import { availability, effectivePriceMinor, type VariantLike } from "@/lib/stock";

/**
 * Add-to-selection control for the product page.
 *
 * "Selection" rather than "cart", and "Request this piece" rather than "Buy
 * now", because nothing here is charged at checkout — the house confirms stone
 * availability and sizing first. Calling it a cart would set the wrong
 * expectation about what the button does.
 *
 * When the piece has options, one must be chosen before the button will do
 * anything. That is enforced on the server too — this is only the courtesy of
 * saying so before the round trip.
 */
export default function AddToSelection({
  productId,
  productName,
  priceOnEnquiry,
  priceMinor,
  madeToOrder,
  soldOut = false,
  stock,
  variantAxis,
  variants,
}: {
  productId: string;
  productName: string;
  /** No published figure — the piece is quoted by hand, so there is nothing
      to add to a selection and the control becomes an enquiry instead. */
  priceOnEnquiry: boolean;
  priceMinor: number;
  madeToOrder: boolean;
  /** The studio's sold-out switch. Overrides stock and made-to-order. */
  soldOut?: boolean;
  stock: number;
  variantAxis: string | null;
  variants: VariantLike[];
}) {
  const { add, busy, wishlist, toggleWishlist } = useCart();
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string | null>(
    // Preselect when there is only one option — making someone click the single
    // available size is friction with no decision behind it.
    variants.length === 1 ? variants[0]!.id : null,
  );
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saved = wishlist.includes(productId);
  const product = { madeToOrder, soldOut, stock, priceMinor, variants };

  if (priceOnEnquiry) {
    return (
      <div>
        <p className="body-lg text-graphite/70">
          {soldOut
            ? "This piece has found its home. Tell us what you loved about it, and the atelier will make you something similar."
            : "This piece is offered on enquiry. Tell us your size and any change you would like, and the atelier will come back with a written quotation."}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a href="#enquire" className="btn-gold flex-1 text-center sm:flex-none">
            {soldOut ? "Enquire about a similar piece" : "Enquire about this piece"}
          </a>

          <button
            type="button"
            onClick={() => void toggleWishlist(productId)}
            aria-pressed={saved}
            className="btn-outline text-plum"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.4}
              aria-hidden
            >
              <path
                d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"
                strokeLinejoin="round"
              />
            </svg>
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    );
  }
  const state = availability(product);

  const chosen = variants.find((variant) => variant.id === selected) ?? null;
  const axis = variantAxis || "Option";
  const shown = effectivePriceMinor(product, chosen);

  // Only worth showing a per-option price when the options actually differ —
  // otherwise it is the same number twice on one screen.
  const pricesVary =
    variants.length > 0 &&
    new Set(variants.map((variant) => effectivePriceMinor(product, variant))).size > 1;

  async function onAdd() {
    setError(null);

    if (variants.length > 0 && !selected) {
      setError(`Choose a ${axis.toLowerCase()} first.`);
      return;
    }

    const result = await add(productId, {
      quantity: 1,
      note: note.trim() || undefined,
      variantId: selected ?? undefined,
    });

    if (result.ok) {
      setAdded(true);
      setNote("");
      // Revert the confirmation so the control is reusable, e.g. for a
      // different size of the same piece.
      setTimeout(() => setAdded(false), 4000);
    } else {
      setError(result.error ?? "We could not add that just now. Please try again.");
    }
  }

  return (
    <div>
      {variants.length > 0 && (
        <fieldset className="mb-8">
          <legend className="label-sm mb-3 block text-graphite/45">
            {axis}
            {pricesVary && chosen && (
              <>
                {" · "}
                <Price minor={shown} className="tabular-nums text-graphite/70" />
              </>
            )}
          </legend>

          <div className="flex flex-wrap gap-2.5">
            {variants.map((variant) => {
              const outOfStock = soldOut || (!madeToOrder && variant.stock <= 0);
              const active = variant.id === selected;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={outOfStock}
                  aria-pressed={active}
                  onClick={() => {
                    setSelected(variant.id);
                    setError(null);
                  }}
                  title={outOfStock ? `${variant.label} — spoken for` : undefined}
                  className={[
                    "min-w-14 border px-4 py-2.5 text-sm font-light transition-colors",
                    active
                      ? "border-plum bg-plum text-ivory"
                      : "border-graphite/20 text-graphite hover:border-plum/50",
                    outOfStock ? "cursor-not-allowed opacity-35 line-through" : "",
                  ].join(" ")}
                >
                  {variant.label}
                </button>
              );
            })}
          </div>

          {chosen && !madeToOrder && chosen.stock > 0 && chosen.stock <= 3 && (
            <p className="mt-3 text-xs font-light text-gold-deep">
              {chosen.stock === 1
                ? `The last ${chosen.label}.`
                : `Only ${chosen.stock} left in ${chosen.label}.`}
            </p>
          )}
        </fieldset>
      )}

      <label className="block">
        <span className="label-sm mb-2 block text-graphite/45">
          Personalisation <span className="opacity-60">(optional)</span>
        </span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={400}
          placeholder={
            variants.length > 0
              ? "An engraving, a different metal…"
              : "Ring size, a different metal, an engraving…"
          }
          className="field text-sm"
        />
      </label>

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onAdd}
          disabled={busy || !state.orderable}
          className="btn-gold flex-1 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
        >
          {added
            ? "Added to your selection"
            : state.orderable
              ? "Add to selection"
              : soldOut
                ? "Sold out"
                : "Spoken for"}
        </button>

        <button
          type="button"
          onClick={() => void toggleWishlist(productId)}
          aria-pressed={saved}
          className="btn-outline text-plum"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.4}
            aria-hidden
          >
            <path
              d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"
              strokeLinejoin="round"
            />
          </svg>
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <div aria-live="polite" className="min-h-6">
        {added && (
          <p className="mt-5 text-sm font-light text-graphite/70">
            {productName}
            {chosen ? ` (${chosen.label})` : ""} is in your selection.{" "}
            <Link href="/cart" className="link-rule text-plum">
              Review it
            </Link>
          </p>
        )}
        {error && (
          <p className="mt-5 text-sm text-[#B4485F]" role="alert">
            {error}
          </p>
        )}
        {!state.orderable && !error && (
          <p className="mt-5 text-sm font-light text-graphite/60">
            {soldOut
              ? "This piece has found its home — but the atelier will gladly make a similar one."
              : "This piece is spoken for — but the atelier will gladly make another."}{" "}
            <Link href="/enquire" className="link-rule text-plum">
              Enquire
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
