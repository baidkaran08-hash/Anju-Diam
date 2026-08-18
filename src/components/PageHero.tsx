import Image from "next/image";
import Link from "next/link";

import { DiamondRule } from "@/components/Logo";

/**
 * Interior page masthead. Uses a still from the house film as its ground, so
 * every page opens on the same footage the home page introduces.
 */
export default function PageHero({
  eyebrow,
  title,
  body,
  frame,
  breadcrumb,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  /** Index into /frames/ultra. */
  frame: number;
  breadcrumb?: { href: string; label: string }[];
  compact?: boolean;
}) {
  return (
    <header
      data-nav-tone="light"
      className={`grain vignette relative isolate flex items-end overflow-hidden bg-ink text-ivory ${
        compact ? "min-h-[52svh] pb-14 pt-32" : "min-h-[72svh] pb-20 pt-40"
      }`}
    >
      <Image
        src={`/frames/ultra/frame-${String(frame).padStart(4, "0")}.webp`}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-45"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/25" />

      <div className="shell w-full">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="label-sm flex flex-wrap items-center gap-2.5 text-ivory/45">
              {breadcrumb.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-2.5">
                  {index > 0 && <span aria-hidden>·</span>}
                  <Link href={crumb.href} className="transition-colors hover:text-gold">
                    {crumb.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <p className="label drift-in mb-6 text-gold">{eyebrow}</p>
        <h1 className="display-xl drift-in max-w-4xl" style={{ animationDelay: "100ms" }}>
          {title}
        </h1>
        {body && (
          <p
            className="drift-in measure mt-8 body-lg text-ivory/65"
            style={{ animationDelay: "200ms" }}
          >
            {body}
          </p>
        )}
        <DiamondRule className="mt-12 h-3 w-32 text-gold/60" />
      </div>
    </header>
  );
}
