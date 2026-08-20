import { LotusMark } from "@/components/Logo";

/**
 * Scoped to /search deliberately.
 *
 * A `loading.tsx` wraps its segment and everything below it in a Suspense
 * boundary, and once that shell flushes the HTTP status is already committed
 * as 200 — so a later `notFound()` renders the not-found page with a 200,
 * which a crawler reads as a real page. A root-level loading.tsx therefore
 * turned every /products/[slug] and /collections/[category] miss into a soft
 * 404.
 *
 * Search is the one route that can genuinely be slow and can never 404, so it
 * is the only place this belongs.
 */
export default function SearchLoading() {
  return (
    <div
      className="grid min-h-[70svh] place-content-center bg-champagne"
      role="status"
      aria-live="polite"
    >
      <LotusMark tone="plum" className="h-14 w-auto animate-pulse opacity-50" />
      <span className="sr-only">Searching</span>
    </div>
  );
}
