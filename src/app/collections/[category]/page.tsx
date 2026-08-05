import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CollectionBrowser from "@/components/CollectionBrowser";
import { CATEGORIES, bySlug } from "@/lib/catalogue";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> },
): Promise<Metadata> {
  const category = bySlug((await params).category);
  if (!category) return { title: "Collection" };
  return {
    title: category.name,
    description: `${category.name} by Anju Diam — ${category.tag}. Handcrafted in 18-karat gold, set with diamonds of G colour or higher and VS clarity or above.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const category = bySlug((await params).category);
  if (!category) notFound();

  return (
    <main className="bg-ivory text-charcoal">
      <div className="mx-auto max-w-[1360px] px-6 pb-24 pt-40 md:px-12 md:py-36 md:pt-48">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
          <div>
            <span className="label text-wine">Collections</span>
            <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(30px,4.6vw,62px)] leading-[1.06] tracking-tight text-plum">
              {category.name}
            </h1>
          </div>
          <p className="max-w-[40ch] text-sm leading-[1.78] text-charcoal/70">
            {category.tag}. Handcrafted in 18-karat gold, set with diamonds of G colour or higher and
            VS clarity or above.
          </p>
        </div>

        <CollectionBrowser category={category.key} fallbackImage={`/collections/${category.slug}.webp`} />
      </div>
    </main>
  );
}
