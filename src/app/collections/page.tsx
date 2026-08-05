import Link from "next/link";
import type { Metadata } from "next";
import CollectionBrowser from "@/components/CollectionBrowser";
import { CATEGORIES } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Around 250 pieces across rings, earrings, pendants, bracelets and bridal — each handcrafted in 18-karat gold.",
};

export default function CollectionsPage() {
  return (
    <main className="bg-ivory text-charcoal">
      <div className="mx-auto max-w-[1360px] px-6 pb-24 pt-40 md:px-12 md:py-36 md:pt-48">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
          <div>
            <span className="label text-wine">Collections</span>
            <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(30px,4.6vw,62px)] leading-[1.06] tracking-tight text-plum">
              All collections
            </h1>
          </div>
          <p className="max-w-[40ch] text-sm leading-[1.78] text-charcoal/70">
            Every piece is handcrafted in 18-karat gold, set with diamonds of G colour or higher and VS
            clarity or above, and open to customisation.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-5">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/collections/${category.slug}`}
              className="group relative block aspect-4/5 overflow-hidden bg-plum"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/collections/${category.slug}.webp`}
                alt={`${category.name} by Anju Diam`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <span
                className="absolute inset-0 bg-linear-to-t from-ink/90 via-ink/10 to-transparent"
                aria-hidden
              />
              <span className="absolute inset-x-0 bottom-0 z-10 p-5">
                <span className="block font-display text-[clamp(18px,1.7vw,24px)] text-ivory">
                  {category.name}
                </span>
                <span className="label mt-2 block text-gold">{category.tag}</span>
              </span>
            </Link>
          ))}
        </div>

        <CollectionBrowser fallbackImage="/collections/rings.webp" />
      </div>
    </main>
  );
}
