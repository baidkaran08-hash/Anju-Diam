import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import PageHero from "@/components/PageHero";
import CatalogueBrowser from "@/components/CatalogueBrowser";
import { listProducts, priceBounds } from "@/lib/catalogue";
import type { ProductQuery } from "@/lib/catalogue";
import { categories, categoryBySlug } from "@/lib/site";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = categoryBySlug.get(slug as never);

  // Raised here, not just in the page body — see the note in
  // products/[slug]/page.tsx. Otherwise this 404 is served as a 200.
  if (!category) notFound();

  return {
    title: category.name,
    description: category.blurb,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: slug } = await params;
  const category = categoryBySlug.get(slug as never);
  if (!category) notFound();

  const raw = await searchParams;
  const query: Partial<ProductQuery> = Object.fromEntries(
    Object.entries(raw).filter(([, value]) => typeof value === "string" && value !== ""),
  ) as Partial<ProductQuery>;

  const [initial, bounds] = await Promise.all([
    listProducts({ ...query, category: category.enumValue, perPage: 24 }),
    priceBounds(category.enumValue),
  ]);

  return (
    <>
      <PageHero
        eyebrow={`${initial.total} pieces`}
        title={category.name}
        body={category.blurb}
        frame={category.frame}
        breadcrumb={[
          { href: "/", label: "Home" },
          { href: "/collections", label: "Collections" },
        ]}
      />

      <section className="bg-champagne py-16 md:py-24">
        <div className="shell">
          <Suspense fallback={<div className="h-96 shimmering" />}>
            <CatalogueBrowser
              category={category.enumValue}
              bounds={bounds}
              initial={initial}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
}
