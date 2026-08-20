import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import IllusionDiagram from "@/components/IllusionDiagram";
import Logo, { DiamondRule } from "@/components/Logo";
import { site, houseStandard } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Founded in Bangkok in 1993 by Sanjay Kothari, Anju Diam Co., Ltd. was built on knowledge before craftsmanship — and on a house standard of 18-karat gold and natural diamonds of G colour and VS clarity.",
};

/**
 * The narrative copy here is the client's own "Our Story" write-up, used close
 * to verbatim. It is the strongest asset the brand has and does not need
 * rewriting — only setting.
 */
const STORY = [
  "Founded in 1993 by Sanjay Kothari, Anju Diam Co., Ltd. was built on knowledge before craftsmanship. Beginning as a trader of loose diamonds, Sanjay Kothari dedicated years to understanding every facet of a diamond — its quality, grading, brilliance, and value. This pursuit of excellence laid the foundation for what would become a trusted name in fine diamond jewelry.",
  "As expertise grew, so did the vision. Through extensive research into precious gemstones, precious metals, and evolving jewelry design, Anju Diam Co., Ltd. expanded into creating exquisite fine jewelry that seamlessly blends timeless elegance with contemporary sophistication.",
  "Today, the company embodies the philosophy of quiet luxury — pieces that speak through exceptional craftsmanship rather than excess. Our designs are refined, versatile, and created for those who appreciate understated elegance. While our values remain rooted in tradition, our approach continues to evolve with the lifestyles and tastes of each new generation.",
];

const CRAFT = [
  "Our expertise in fine diamond jewelry and illusion settings allows us to create pieces that maximize light, brilliance, and visual impact while maintaining elegance and wearability. From timeless classics to contemporary designs, every piece reflects precision, artistry, and meticulous attention to detail.",
  "At Anju Diam Co., Ltd., luxury is also personal. We understand that every client has a unique vision, which is why customization is central to our philosophy. Whether reimagining a classic silhouette or bringing a bespoke design to life, we work closely with every client to create jewelry that is deeply personal and enduring.",
];

const TIMELINE = [
  {
    year: "1993",
    title: "A diamond trader in Bangkok",
    body: "Sanjay Kothari begins trading loose diamonds, spending years learning to read a stone — its quality, its grading, its brilliance and its true value.",
  },
  {
    year: "2000s",
    title: "From stones to jewellery",
    body: "Research into precious gemstones, metals and evolving design takes the house from trading into making — fine commercial jewellery, built on the same knowledge.",
  },
  {
    year: "Today",
    title: "A speciality in illusion settings",
    body: "The house becomes known for illusion work: hand-cut, mirror-finished plates that extend a diamond's spread far beyond its carat weight.",
  },
  {
    year: "Always",
    title: "One promise",
    body: "Uncompromising quality, honest value, and timeless craftsmanship. Every piece designed to celebrate a meaningful moment and become an heirloom.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={`Bangkok · Since ${site.founded}`}
        title="True luxury begins with uncompromising quality."
        body="More than three decades of fine natural diamond jewellery, built on knowledge before craftsmanship."
        frame={232}
        breadcrumb={[{ href: "/", label: "Home" }]}
      />

      {/* ── Our story ─────────────────────────────────────────────────────── */}
      <section className="bg-champagne py-28 md:py-40">
        <div className="shell grid gap-16 lg:grid-cols-[0.65fr_1.35fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <p className="label mb-6 text-wine">Our Story</p>
              <h2 className="display-md text-plum">Knowledge before craftsmanship.</h2>
            </Reveal>
          </div>

          <div>
            {STORY.map((paragraph, index) => (
              <Reveal key={index} delay={index * 100}>
                <p className="measure mb-8 body-lg text-graphite/75">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── The house standard ────────────────────────────────────────────── */}
      <section id="standard" data-nav-tone="light" className="grain relative bg-plum py-28 text-ivory md:py-40">
        <div className="shell">
          <SectionHeading
            eyebrow="The House Standard"
            tone="light"
            align="center"
            title="Exceptional jewellery begins with exceptional materials."
            body="Every creation is thoughtfully crafted in 18-karat gold and set with carefully selected natural diamonds of G colour or higher and VS clarity or above. Every stone is earth-mined, never laboratory-grown, and chosen for its brilliance, purity and beauty without compromise."
          />

          <div className="mt-20 grid gap-px overflow-hidden border border-gold/20 bg-gold/20 sm:grid-cols-3">
            {[
              { value: houseStandard.metal, label: "The only metal we work in" },
              { value: houseStandard.colour, label: "Never a stone below it" },
              { value: houseStandard.clarity, label: "Eye-clean, every piece" },
            ].map((item, index) => (
              <Reveal key={item.label} delay={index * 100} className="bg-plum p-10 text-center md:p-14">
                <p className="display-sm text-gold">{item.value}</p>
                <p className="label-sm mt-4 text-ivory/50">{item.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Craftsmanship ─────────────────────────────────────────────────── */}
      <section id="craft" className="bg-champagne py-28 md:py-40">
        <div className="shell grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Craftsmanship"
              title="Maximum light, without excess."
            />
            {CRAFT.map((paragraph, index) => (
              <Reveal key={index} delay={140 + index * 100}>
                <p className="measure mt-8 body-lg text-graphite/75">{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={160}>
            <div className="border border-gold/25 bg-ivory p-10 md:p-14">
              <IllusionDiagram className="h-auto w-full" />
              <p className="mt-8 text-xs font-light leading-relaxed text-graphite/50">
                An illusion setting places small natural diamonds into a mirror-finished plate cut to their
                exact girdle line. Light carries across the join, so the cluster reads as a single
                larger stone — the same presence, at a fraction of the stone cost.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Timeline ──────────────────────────────────────────────────────── */}
      <section data-nav-tone="light" className="relative isolate overflow-hidden bg-ink py-28 text-ivory md:py-40">
        <Image
          src="/frames/ultra/frame-0166.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover opacity-20"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink via-ink/90 to-ink" />

        <div className="shell">
          <SectionHeading eyebrow="Three Decades" tone="light" title="How the house was built." />

          <ol className="mt-20 grid gap-px bg-gold/20 md:grid-cols-2 lg:grid-cols-4">
            {TIMELINE.map((entry, index) => (
              <Reveal key={entry.year} delay={index * 110} as="li" className="bg-ink p-9 md:p-10">
                <p className="display-sm text-gold">{entry.year}</p>
                <h3 className="mt-5 text-base font-normal text-ivory">{entry.title}</h3>
                <p className="mt-4 text-sm font-light leading-relaxed text-ivory/55">{entry.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Closing ───────────────────────────────────────────────────────── */}
      <section className="bg-champagne py-28 text-center md:py-40">
        <div className="shell-narrow">
          <Reveal>
            <DiamondRule className="mx-auto h-3 w-40 text-gold" />
          </Reveal>
          <Reveal delay={100}>
            <p className="display-lg mt-12 text-plum">
              Because true luxury is never loud — it is crafted with purpose, worn with confidence,
              and treasured forever.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <p className="measure mx-auto mt-10 body-lg text-graphite/70">
              For more than three decades, {site.legalName} has remained committed to one promise:
              delivering uncompromising quality, honest value, and timeless craftsmanship. Every
              piece is designed to celebrate life&rsquo;s most meaningful moments and become an
              heirloom that will be cherished for generations.
            </p>
          </Reveal>
          <Reveal delay={320}>
            <div className="mt-14 flex flex-wrap justify-center gap-4">
              <Link href="/collections" className="btn-gold">
                View the collections
              </Link>
              <Link href="/custom" className="btn-outline text-plum">
                Commission a piece
              </Link>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <Logo tone="plum" className="mt-24 text-plum" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
