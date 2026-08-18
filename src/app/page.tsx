import Image from "next/image";
import Link from "next/link";

import manifest from "../../public/frames/manifest.json";
import HomeHero from "@/components/HomeHero";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import ProductCard from "@/components/ProductCard";
import IllusionDiagram from "@/components/IllusionDiagram";
import EnquiryForm from "@/components/EnquiryForm";
import Hallmarks from "@/components/Hallmarks";
import { DiamondRule } from "@/components/Logo";
import { getFeatured, categoryCounts } from "@/lib/catalogue";
import { categories, site, houseStandard } from "@/lib/site";

export const revalidate = 300;

const frame = (index: number) => `/frames/ultra/frame-${String(index).padStart(4, "0")}.webp`;

const STANDARD = [
  { value: String(site.founded), label: "Founded in Bangkok" },
  { value: "18k", label: "Gold, never plated" },
  { value: "G+", label: "Colour, or higher" },
  { value: "VS+", label: "Clarity, or above" },
];

export default async function HomePage() {
  const [featured, counts] = await Promise.all([getFeatured(), categoryCounts()]);

  return (
    <>
      <HomeHero frameCount={manifest.frameCount} poster={manifest.poster} />

      {/* ── Statement ─────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-28 md:py-40">
        <div className="shell-narrow text-center">
          <Reveal>
            <DiamondRule className="mx-auto h-3 w-36 text-gold" />
          </Reveal>
          <Reveal delay={100}>
            <p className="display-lg mt-12 text-plum">
              True luxury begins with uncompromising quality.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p className="measure mx-auto mt-10 body-lg text-graphite/70">
              Founded in {site.founded} by {site.founder}, {site.legalName} was built on knowledge
              before craftsmanship. Beginning as a trader of loose diamonds, he spent years
              understanding every facet of a stone — its quality, grading, brilliance and value.
              That pursuit laid the foundation for what would become a trusted name in fine natural
              diamond jewellery.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <Link href="/about" className="label link-rule mt-12 inline-block text-plum hover:text-wine">
              Read our story
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Collections ───────────────────────────────────────────────────── */}
      <section className="bg-ivory pb-28 md:pb-40">
        <div className="shell">
          <SectionHeading
            eyebrow="The Collections"
            title="Five houses of work."
            body="Each collection is built around a different problem of wear — how a ring sits, how a drop swings, how a line follows the collarbone."
            action={{ href: "/collections", label: "All collections" }}
          />

          <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Reveal
                key={category.slug}
                delay={index * 90}
                className={index === 0 ? "lg:col-span-2 lg:row-span-1" : ""}
              >
                <Link
                  href={`/collections/${category.slug}`}
                  className="group relative block h-full overflow-hidden bg-ink"
                >
                  <div className={`relative ${index === 0 ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
                    <Image
                      src={frame(category.frame)}
                      alt=""
                      fill
                      sizes={index === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
                      className="object-cover opacity-85 transition-all duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
                      <div className="flex items-end justify-between gap-6">
                        <div>
                          <p className="label-sm mb-3 text-gold">
                            {counts[category.enumValue] ?? 0} pieces
                          </p>
                          <h3 className="display-md text-ivory">{category.name}</h3>
                        </div>
                        <span className="label-sm shrink-0 pb-2 text-ivory/60 transition-colors group-hover:text-gold">
                          View →
                        </span>
                      </div>
                      {index === 0 && (
                        <p className="measure mt-4 hidden text-sm font-light leading-relaxed text-ivory/60 md:block">
                          {category.blurb}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── The house standard ────────────────────────────────────────────── */}
      <section data-nav-tone="light" className="grain relative bg-plum py-24 text-ivory md:py-32">
        <div className="shell">
          <div className="grid gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {STANDARD.map((item, index) => (
              <Reveal key={item.label} delay={index * 90} className="text-center">
                <p className="display-lg text-gold">{item.value}</p>
                <p className="label-sm mt-4 text-ivory/55">{item.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured pieces ───────────────────────────────────────────────── */}
      <section className="bg-ivory py-28 md:py-40">
        <div className="shell">
          <SectionHeading
            eyebrow="One From Each House"
            title="The pieces we would show you first."
            body="A single piece from every collection, chosen for the work in it rather than the weight of the stone."
            action={{ href: "/collections", label: "Browse all pieces" }}
          />

          <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {featured.map((product, index) => (
              <Reveal key={product.id} delay={index * 70}>
                <ProductCard product={product} index={index} tone={index % 2 ? "ivory" : "plum"} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Illusion setting ──────────────────────────────────────────────── */}
      <section id="illusion" className="bg-stone/45 py-28 md:py-40">
        <div className="shell grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="The House Speciality"
              title="More stone than the stone."
              body="An illusion setting is a mirror-finished plate, cut and polished by hand, that continues the light of the diamonds sitting in it. Done well, three small stones read as one large one — and the piece carries the presence of a solitaire several times the price."
            />
            <Reveal delay={240}>
              <p className="measure mt-8 text-sm font-light leading-relaxed text-graphite/60">
                It is difficult work. The plate has to be cut to the exact girdle line of each
                stone, and any flaw in the polish shows immediately as a dull edge. It is also the
                work {site.name} has specialised in since {site.founded}.
              </p>
            </Reveal>
            <Reveal delay={320}>
              <Link
                href="/collections?illusion=true"
                className="label link-rule mt-10 inline-block text-plum hover:text-wine"
              >
                See the illusion pieces
              </Link>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <div className="border border-gold/25 bg-ivory p-10 md:p-14">
              <IllusionDiagram className="h-auto w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Bespoke ───────────────────────────────────────────────────────── */}
      <section data-nav-tone="light" className="relative isolate overflow-hidden bg-ink py-32 text-ivory md:py-44">
        <Image
          src={frame(196)}
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover opacity-30"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/35" />

        <div className="shell">
          <div className="max-w-xl">
            <SectionHeading
              eyebrow="Bespoke"
              tone="light"
              title="Bring us a drawing, a photograph, or an idea."
              body="Roughly half of what leaves the atelier was never in a collection. We work from sketches, from a stone you already own, or from a piece you would like reimagined for a different hand."
            />
            <Reveal delay={260}>
              <div className="mt-12 flex flex-wrap gap-4">
                <Link href="/custom" className="btn-gold">
                  Start a commission
                </Link>
                <Link href="/contact" className="btn-outline text-ivory">
                  Talk to the house
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Hallmarks ─────────────────────────────────────────────────────── */}
      <Hallmarks />

      {/* ── Enquiry ───────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-28 md:py-40">
        <div className="shell grid gap-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeading
              eyebrow="Enquiries"
              title="Write to us."
              body={`Every piece is ${houseStandard.metal}, ${houseStandard.colour}, ${houseStandard.clarity}. Tell us what you are looking for and we will tell you honestly what it takes to make it.`}
            />
          </div>
          <Reveal delay={120}>
            <EnquiryForm showCategory />
          </Reveal>
        </div>
      </section>
    </>
  );
}
