"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/CartProvider";

/**
 * Add-to-selection control for the product page.
 *
 * "Selection" rather than "cart", and "Request this piece" rather than "Buy
 * now", because nothing here is charged at checkout — the house confirms stone
 * availability and sizing first. Calling it a cart would set the wrong
 * expectation about what the button does.
 */
export default function AddToSelection({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { add, busy, wishlist, toggleWishlist } = useCart();
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const [failed, setFailed] = useState(false);

  const saved = wishlist.includes(productId);

  async function onAdd() {
    setFailed(false);
    const ok = await add(productId, 1, note.trim() || undefined);
    if (ok) {
      setAdded(true);
      setNote("");
      // Revert the confirmation so the control is reusable, e.g. for a
      // different size of the same piece.
      setTimeout(() => setAdded(false), 4000);
    } else {
      setFailed(true);
    }
  }

  return (
    <div>
      <label className="block">
        <span className="label-sm mb-2 block text-graphite/45">
          Personalisation <span className="opacity-60">(optional)</span>
        </span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={400}
          placeholder="Ring size, a different metal, an engraving…"
          className="field text-sm"
        />
      </label>

      <div className="mt-8 flex flex-wrap gap-4">
        <button type="button" onClick={onAdd} disabled={busy} className="btn-gold flex-1 sm:flex-none">
          {added ? "Added to your selection" : "Add to selection"}
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
            {productName} is in your selection.{" "}
            <Link href="/cart" className="link-rule text-plum">
              Review it
            </Link>
          </p>
        )}
        {failed && (
          <p className="mt-5 text-sm text-[#B4485F]" role="alert">
            We could not add that just now. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
