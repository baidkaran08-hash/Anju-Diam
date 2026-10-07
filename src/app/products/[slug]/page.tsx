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
import { certLabLabel, metalLabel, stoneShapeLabel, type CertLab, type Metal, type StoneShape } from "@/lib/enums";
import { availability, priceRangeMinor } from "@/lib/stock";

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

  const state = availability(product);
  const range = priceRangeMinor(product);
  const priceVaries = range.min !== range.max;

  /**
   * A piece imported from the house stock sheet carries only what the sheet
   * recorded — often weight, carat and nothing else. Rows whose value is
   * unknown are dropped from the table rather than printed as a default, so
   * the page never asserts a colour or a clarity nobody graded.
   */
  const spec: [string, string][] = (
    [
      ["Metal", metalLabel[product.metal as Metal] ?? product.metal],
      ["Gross weight", product.grossWeightG > 0 ? `${product.grossWeightG.toFixed(2)} g` : ""],
      [
        "Diamonds",
        product.diamondCount > 0
          ? `${product.diamondCount} natural ${product.diamondCount === 1 ? "stone" : "stones"}`
          : "",
      ],
      ["Origin", "Natural, earth-mined"],
      [
        "Total carat weight",
        product.diamondCaratW > 0 ? `${product.diamondCaratW.toFixed(2)} ct` : "",
      ],
      ["Colour", product.diamondColour],
      ["Clarity", product.diamondClarity],
      ["Cut", product.stoneShape ? stoneShapeLabel[product.stoneShape as StoneShape] ?? product.stoneShape : ""],
      ["Setting", product.illusionSet ? "Illusion set" : ""],
    ] as [string, string][]
  ).filter(([, value]) => value.trim() !== "");

  /** Same rule for the headline strip over the photograph. */
  const highlights: [string, string][] = (
    [
      ["Carat", product.diamondCaratW > 0 ? `${product.diamondCaratW.toFixed(2)} ct` : ""],
      ["Colour", product.diamondColour],
      ["Clarity", product.diamondClarity],
      ["Gold", product.grossWeightG > 0 ? `${product.grossWeightG.toFixed(2)} g` : ""],
    ] as [string, string][]
  )
    .filter(([, value]) => value.trim() !== "")
    .slice(0, 3);

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
      // Schema.org uses 0 to mean "ask" — publishing the internal figure here
      // would hand a crawler exactly the number the page declines to show.
      price: product.priceOnEnquiry ? "0" : (range.min / 100).toFixed(2),
      priceCurrency: product.currency,
      // Google penalises a feed that claims availability it does not have, so
      // this follows the same rule the button does rather than always saying
      // MadeToOrder.
      availability: product.madeToOrder
        ? "https://schema.org/MadeToOrder"
        : state.orderable
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
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
                <dl
                  className="glass glass-r absolute inset-x-4 bottom-4 grid gap-2 px-5 py-4 text-ivory md:inset-x-6 md:bottom-6 md:px-7 md:py-5"
                  style={{ gridTemplateColumns: `repeat(${Math.max(1, highlights.length)}, minmax(0, 1fr))` }}
                >
                  {highlights.map(([term, value]) => (
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

              {product.priceOnEnquiry ? (
                <>
                  <p className="mt-6 text-2xl font-light text-graphite">Price on enquiry</p>
                  <p className="label-sm mt-3 text-graphite/40">
                    {state.label} · Written quotation within one business day
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-6 flex items-baseline gap-3">
                    {priceVaries && (
                      <span className="text-sm font-light text-graphite/45">from</span>
                    )}
                    <Price
                      minor={range.min}
                      className="block text-2xl font-light tabular-nums text-graphite"
                    />
                  </div>
                  <p className="label-sm mt-3 text-graphite/40">
                    {state.label} · Final price confirmed before payment
                  </p>
                </>
              )}
              {!product.priceOnEnquiry && <ConversionNote className="mt-3 text-graphite/45" />}

              <DiamondRule className="my-10 h-3 w-40 text-gold" />

              <p className="body-lg text-graphite/75">{product.description}</p>

              <div className="mt-12">
                <AddToSelection
                  productId={product.id}
                  productName={product.name}
                  priceOnEnquiry={product.priceOnEnquiry}
                  priceMinor={product.priceMinor}
                  madeToOrder={product.madeToOrder}
                  stock={product.stock}
                  variantAxis={product.variantAxis}
                  variants={product.variants.map((variant) => ({
                    id: variant.id,
                    label: variant.label,
                    sku: variant.sku,
                    priceMinor: variant.priceMinor,
                    stock: variant.stock,
                    position: variant.position,
                  }))}
                />
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

              {/* ── Grading reports ─────────────────────────────────────── */}
              {product.certificates.length > 0 && (
                <section className="mt-16" aria-labelledby="reports">
                  <h2 id="reports" className="label mb-8 text-wine">
                    {product.certificates.length === 1 ? "Grading report" : "Grading reports"}
                  </h2>

                  <ul className="space-y-5">
                    {product.certificates.map((certificate) => {
                      const detail = [
                        certificate.caratW ? `${certificate.caratW.toFixed(2)} ct` : null,
                        certificate.colour,
                        certificate.clarity,
                        certificate.cut,
                      ].filter(Boolean);

                      return (
                        <li
                          key={certificate.id}
                          className="border border-graphite/12 px-6 py-5"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                            <p className="text-sm font-light text-plum">
                              {certLabLabel[certificate.lab as CertLab] ?? certificate.lab}
                              <span className="text-graphite/45"> · </span>
                              <span className="tabular-nums text-graphite/70">
                                {certificate.number}
                              </span>
                            </p>

                            {certificate.documentUrl && (
                              <a
                                href={certificate.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-rule text-sm text-plum"
                              >
                                View the report
                              </a>
                            )}
                          </div>

                          {detail.length > 0 && (
                            <p className="mt-2 text-xs font-light tabular-nums text-graphite/55">
                              {detail.join(" · ")}
                              {certificate.issuedOn && (
                                <>
                                  {" · issued "}
                                  {certificate.issuedOn.toLocaleDateString("en-GB", {
                                    year: "numeric",
                                    month: "long",
                                  })}
                                </>
                              )}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
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
      {/* scroll-mt keeps the heading clear of the fixed header when the
          "Enquire about this piece" button jumps down here. */}
      <section id="enquire" className="scroll-mt-28 bg-champagne py-24 md:py-32">
        <div className="shell grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="label mb-5 text-wine">Enquire</p>
            <h2 className="display-md text-plum">Questions about this piece?</h2>
            <p className="measure mt-6 text-graphite/70">
              {product.priceOnEnquiry
                ? "Tell us which piece and what you have in mind — sizing, an alternative metal, a larger centre stone. We reply with a written quotation, and honestly about what is possible."
                : "Sizing, an alternative metal, a larger centre stone, or the same design at a different budget — write to us and we will answer honestly."}
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
