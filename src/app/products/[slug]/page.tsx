import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProductMedia from "@/components/ProductMedia";
import ProductCard from "@/components/ProductCard";
import AddToSelection from "@/components/AddToSelection";
import EnquiryForm from "@/components/EnquiryForm";
import Reveal from "@/components/Reveal";
import { DiamondRule } from "@/components/Logo";
import { getProductBySlug, getRelated } from "@/lib/catalogue";
import { Price, ConversionNote } from "@/components/CurrencyProvider";
import { categoryByEnum, site, whatsappHref } from "@/lib/site";
import { metalLabel, stoneShapeLabel, type Metal, type StoneShape } from "@/lib/enums";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // notFound() has to be raised here rather than only in the page body. By the
  // time the body runs, metadata has resolved and the response has begun
  // streaming, so Next can no longer set the status — the not-found page
  // renders but with a 200, which reads to a crawler as a real page.
  if (!product) notFound();

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { title: product.name, description: product.description.slice(0, 200) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelated(product);
  const category = categoryByEnum.get(product.category as never);

  const spec: [string, string][] = [
    ["Metal", metalLabel[product.metal as Metal] ?? product.metal],
    ["Gross weight", `${product.grossWeightG.toFixed(2)} g`],
    ["Diamonds", `${product.diamondCount} natural ${product.diamondCount === 1 ? "stone" : "stones"}`],
    ["Origin", "Natural, earth-mined"],
    ["Total carat weight", `${product.diamondCaratW.toFixed(2)} ct`],
    ["Colour", product.diamondColour],
    ["Clarity", product.diamondClarity],
    ["Cut", stoneShapeLabel[product.stoneShape as StoneShape] ?? product.stoneShape],
    ["Setting", product.illusionSet ? "Illusion set" : "Claw set"],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: site.name },
    material: `${metalLabel[product.metal as Metal]}, natural diamond`,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Diamond origin",
        value: "Natural, earth-mined",
      },
    ],
    offers: {
      "@type": "Offer",
      price: (product.priceMinor / 100).toFixed(2),
      priceCurrency: product.currency,
      availability: "https://schema.org/MadeToOrder",
      seller: { "@type": "Organization", name: site.legalName },
    },
  };

  const whatsapp = whatsappHref(
    `Hello Anju Diam, I am interested in the ${product.name} (${product.slug}).`,
  );

  return (
    <>
      <article className="bg-champagne pt-28 md:pt-36">
        <div className="shell">
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="label-sm flex flex-wrap items-center gap-2.5 text-graphite/40">
              <li>
                <Link href="/" className="transition-colors hover:text-plum">
                  Home
                </Link>
              </li>
              <li aria-hidden>·</li>
              <li>
                <Link href="/collections" className="transition-colors hover:text-plum">
                  Collections
                </Link>
              </li>
              {category && (
                <>
                  <li aria-hidden>·</li>
                  <li>
                    <Link
                      href={`/collections/${category.slug}`}
                      className="transition-colors hover:text-plum"
                    >
                      {category.name}
                    </Link>
                  </li>
                </>
              )}
            </ol>
          </nav>

          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            {/* ── Media ─────────────────────────────────────────────────── */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="relative aspect-[4/5] overflow-hidden bg-plum">
                <ProductMedia
                  product={product}
                  tone="plum"
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />

                {/* Glass spec strip. The headline numbers stay with the piece
                    when the detail column has scrolled away on a phone. */}
                <dl className="glass glass-r absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2 px-5 py-4 text-ivory md:inset-x-6 md:bottom-6 md:px-7 md:py-5">
                  {[
                    ["Carat", `${product.diamondCaratW.toFixed(2)} ct`],
                    ["Colour", product.diamondColour],
                    ["Clarity", product.diamondClarity],
                  ].map(([term, value]) => (
                    <div key={term} className="text-center">
                      <dt className="label-sm text-ivory/45">{term}</dt>
                      <dd className="mt-2 text-sm font-light tabular-nums text-gold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {product.images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {product.images.slice(1, 5).map((image) => (
                    <div key={image.id} className="relative aspect-square overflow-hidden bg-plum">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Detail ────────────────────────────────────────────────── */}
            <div className="pb-20">
              {product.illusionSet && (
                <p className="label mb-5 text-gold-deep">The house speciality · Illusion set</p>
              )}

              <h1 className="display-lg text-plum">{product.name}</h1>

              <Price
                minor={product.priceMinor}
                className="mt-6 block text-2xl font-light tabular-nums text-graphite"
              />
              <p className="label-sm mt-3 text-graphite/40">
                Made to order · Final price confirmed before payment
              </p>
              <ConversionNote className="mt-3 text-graphite/45" />

              <DiamondRule className="my-10 h-3 w-40 text-gold" />

              <p className="body-lg text-graphite/75">{product.description}</p>

              <div className="mt-12">
                <AddToSelection productId={product.id} productName={product.name} />
              </div>

              {whatsapp && (
                <p className="mt-6 text-sm font-light text-graphite/55">
                  Prefer to talk?{" "}
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-rule text-plum"
                  >
                    Message us on WhatsApp
                  </a>
                </p>
              )}

              {/* ── Specification ───────────────────────────────────────── */}
              <section className="mt-16" aria-labelledby="spec">
                <h2 id="spec" className="label mb-8 text-wine">
                  Specification
                </h2>
                <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                  {spec.map(([term, value]) => (
                    <div
                      key={term}
                      className="flex items-baseline justify-between gap-6 border-b border-graphite/10 py-4"
                    >
                      <dt className="label-sm text-graphite/45">{term}</dt>
                      <dd className="text-sm font-light tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 text-xs font-light leading-relaxed text-graphite/45">
                  Every stone is a natural, earth-mined diamond — never laboratory-grown. Each
                  piece is supplied with a house certificate detailing its stones.
                  Weights are nominal and confirmed on the finished piece.
                </p>
              </section>
            </div>
          </div>
        </div>
      </article>

      {/* ── Related ─────────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-sand/50 py-24 md:py-32">
          <div className="shell">
            <div className="mb-14 flex items-end justify-between gap-6">
              <h2 className="display-md text-plum">In the same neighbourhood</h2>
              {category && (
                <Link
                  href={`/collections/${category.slug}`}
                  className="label link-rule shrink-0 text-plum hover:text-wine"
                >
                  All {category.name.toLowerCase()}
                </Link>
              )}
            </div>

            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 70}>
                  <ProductCard product={item} index={index} tone={index % 2 ? "ivory" : "plum"} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Enquire about this piece ────────────────────────────────────── */}
      <section className="bg-champagne py-24 md:py-32">
        <div className="shell grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="label mb-5 text-wine">Enquire</p>
            <h2 className="display-md text-plum">Questions about this piece?</h2>
            <p className="measure mt-6 text-graphite/70">
              Sizing, an alternative metal, a larger centre stone, or the same design at a different
              budget — write to us and we will answer honestly.
            </p>
          </div>
          <EnquiryForm kind="PRODUCT" subject={`${product.name} (${product.slug})`} />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
