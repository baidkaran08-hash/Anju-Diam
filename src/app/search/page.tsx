import type { Metadata } from "next";
import { Suspense } from "react";

import CatalogueBrowser from "@/components/CatalogueBrowser";
import { listProducts, priceBounds } from "@/lib/catalogue";
import type { ProductQuery } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
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
    <section className="bg-ivory pb-28 pt-36 md:pb-40 md:pt-44">
      <div className="shell">
        <p className="label mb-5 text-wine">Search</p>
        <h1 className="display-lg mb-14 text-plum">
          {query.q ? `“${query.q}”` : "Find a piece."}
        </h1>

        <Suspense fallback={<div className="h-96 shimmering" />}>
          <CatalogueBrowser bounds={bounds} initial={initial} />
        </Suspense>
      </div>
    </section>
  );
}
