import type { Metadata } from "next";
import { Suspense } from "react";

import PageHero from "@/components/PageHero";
import CatalogueBrowser from "@/components/CatalogueBrowser";
import { listProducts, priceBounds } from "@/lib/catalogue";
import type { ProductQuery } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "The full Anju Diam catalogue — rings, earrings, necklaces, bracelets and gifting, in 18-karat gold with natural G colour, VS clarity diamonds.",
};

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query: Partial<ProductQuery> = Object.fromEntries(
    Object.entries(raw).filter(([, value]) => typeof value === "string" && value !== ""),
  ) as Partial<ProductQuery>;

  const [initial, bounds] = await Promise.all([
    listProducts({ ...query, perPage: 24 }),
    priceBounds(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="The Catalogue"
        title="Every piece in the house."
        body="Two hundred and fifty pieces, each made to order in the Bangkok atelier. Filter by metal, setting or price — or write to us, because a great deal of what we make never appears here."
        frame={118}
        breadcrumb={[{ href: "/", label: "Home" }]}
      />

      <section className="bg-champagne py-16 md:py-24">
        <div className="shell">
          <Suspense fallback={<div className="h-96 shimmering" />}>
            <CatalogueBrowser bounds={bounds} initial={initial} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
