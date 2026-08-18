"use client";

import { useEffect } from "react";
import Link from "next/link";

import { DiamondRule } from "@/components/Logo";

/**
 * Route-level error boundary.
 *
 * Without this, any error thrown while rendering a page — a client component
 * throwing during hydration, a failed data read — drops the visitor onto an
 * unstyled stack trace in development and a blank grey page in production.
 * This keeps them inside the brand and gives them a way out.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only handle on the server-side stack in production,
    // so it needs to reach the console even though the message is generic.
    console.error("[route error]", error.digest ?? "", error);
  }, [error]);

  return (
    <section className="grid min-h-[70svh] place-content-center bg-ivory px-6 py-32 text-center">
      <DiamondRule className="mx-auto h-3 w-36 text-gold" />
      <h1 className="display-lg mt-10 text-plum">Something went wrong at our end.</h1>
      <p className="measure mx-auto mt-6 body-lg text-graphite/70">
        This is not you. Try again, and if it keeps happening please tell us what you were looking
        at — we would rather know.
      </p>

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <button type="button" onClick={reset} className="btn-gold">
          Try again
        </button>
        <Link href="/collections" className="btn-outline text-plum">
          Back to the collections
        </Link>
        <Link href="/contact" className="btn-outline text-plum">
          Tell us
        </Link>
      </div>

      {error.digest && (
        <p className="label-sm mt-10 text-graphite/35">Reference {error.digest}</p>
      )}
    </section>
  );
}
