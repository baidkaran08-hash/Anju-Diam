import Link from "next/link";
import Image from "next/image";

import { DiamondRule } from "@/components/Logo";

export default function NotFound() {
  return (
    <section data-nav-tone="light" className="grain vignette relative isolate flex min-h-[80svh] items-center overflow-hidden bg-ink text-ivory">
      <Image
        src="/frames/ultra/frame-0140.webp"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover opacity-30"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/40" />

      <div className="shell">
        <p className="label mb-6 text-gold">404</p>
        <h1 className="display-xl max-w-2xl">This piece is not in the vitrine.</h1>
        <p className="measure mt-8 body-lg text-ivory/65">
          The page you were looking for has been moved or never existed. The collections are all
          still here.
        </p>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/collections" className="btn-gold">
            View the collections
          </Link>
          <Link href="/contact" className="btn-outline text-ivory">
            Ask us directly
          </Link>
        </div>
        <DiamondRule className="mt-16 h-3 w-36 text-gold/60" />
      </div>
    </section>
  );
}
