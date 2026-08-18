import type { Metadata } from "next";
import Link from "next/link";

import ProductCard from "@/components/ProductCard";
import { readOwnerKey } from "@/lib/owner";
import { getWishlist } from "@/lib/wishlist";

export const metadata: Metadata = {
  title: "Saved Pieces",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const key = await readOwnerKey();
  const saved = key ? await getWishlist(key) : [];

  return (
    <section className="bg-ivory pb-28 pt-36 md:pb-40 md:pt-44">
      <div className="shell">
        <p className="label mb-5 text-wine">Saved</p>
        <h1 className="display-lg text-plum">
          {saved.length > 0 ? "Pieces you have kept." : "Nothing saved yet."}
        </h1>

        {saved.length === 0 ? (
          <>
            <p className="measure mt-6 body-lg text-graphite/70">
              Tap the heart on any piece and it will wait for you here. Saved pieces follow you into
              your account when you create one.
            </p>
            <Link href="/collections" className="btn-gold mt-10 inline-flex">
              Browse the collections
            </Link>
          </>
        ) : (
          <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((item, index) => (
              <ProductCard
                key={item.id}
                product={item.product}
                index={index}
                tone={index % 3 === 1 ? "ivory" : "plum"}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
