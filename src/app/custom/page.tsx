import type { Metadata } from "next";

import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import EnquiryForm from "@/components/EnquiryForm";
import { houseStandard, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Custom Jewellery",
  description:
    "Bespoke commissions from Anju Diam — from a sketch, a stone you already own, or a piece reimagined. 18-karat gold, G colour, VS clarity.",
};

const STEPS = [
  {
    step: "01",
    title: "Tell us the idea",
    body: "A drawing, a photograph, a description, or a piece you already own and would like reworked. Nothing needs to be resolved — a rough idea is a perfectly good starting point.",
  },
  {
    step: "02",
    title: "We come back with options",
    body: "Sketches and a stone selection, with honest pricing against each. If your idea will not work as drawn — a stone that will catch, a setting that will wear thin — we say so at this stage, not after.",
  },
  {
    step: "03",
    title: "Approval and stone selection",
    body: "You approve the final drawing and we secure the diamonds. Every stone is natural and chosen against the house standard: G colour or higher, VS clarity or above.",
  },
  {
    step: "04",
    title: "Made in the atelier",
    body: "Four to six weeks for most pieces. The setting is cut, the gallery pierced, the stones matched and set, and the whole piece finished by hand.",
  },
  {
    step: "05",
    title: "Delivered with its certificate",
    body: "Final quality check, sizing confirmed, and a house certificate detailing every stone in the piece.",
  },
];

const ANSWERS = [
  {
    q: "Can you work with a stone I already own?",
    a: "Yes, and often it is the best value in the room. We will assess the stone honestly, tell you what it is worth setting into, and design around it.",
  },
  {
    q: "How long does a commission take?",
    a: "Four to six weeks in the atelier for most pieces, plus a week or two beforehand for drawings and stone selection. Matched sets run a little longer.",
  },
  {
    q: "What does a bespoke piece cost?",
    a: "The same as a comparable piece from a collection — we do not charge a premium for design. The variable is the stone. We will give you a firm figure before anything is made.",
  },
  {
    q: "Can you reproduce a design I have seen elsewhere?",
    a: "We will not copy another house's protected design. We will happily take the idea behind it — the silhouette, the setting style, the proportion — and make something that is properly yours.",
  },
];

export default function CustomPage() {
  return (
    <>
      <PageHero
        eyebrow="Bespoke Commissions"
        title="Made for one hand."
        body="Roughly half of what leaves the atelier was never in a collection. Customization is central to how this house works, and has been since the beginning."
        frame={92}
        breadcrumb={[{ href: "/", label: "Home" }]}
      />

      {/* ── Process ───────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-28 md:py-40">
        <div className="shell">
          <SectionHeading
            eyebrow="The Process"
            title="Five steps, no surprises."
            body="Every client has a unique vision. Our job is to translate it into something wearable, priced honestly, and built to last a lifetime."
          />

          <ol className="mt-20 grid gap-px bg-graphite/10 md:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((item, index) => (
              <Reveal key={item.step} delay={index * 90} as="li" className="bg-ivory p-8 md:p-9">
                <p className="label text-gold">{item.step}</p>
                <h3 className="display-sm mt-6 text-plum">{item.title}</h3>
                <p className="mt-4 text-sm font-light leading-relaxed text-graphite/65">{item.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Standard ──────────────────────────────────────────────────────── */}
      <section data-nav-tone="light" className="grain bg-plum py-24 text-ivory md:py-32">
        <div className="shell-narrow text-center">
          <Reveal>
            <p className="label mb-8 text-gold">No Exceptions</p>
            <p className="display-md">
              A bespoke piece is held to exactly the same standard as a collection piece:{" "}
              {houseStandard.metal}, {houseStandard.colour}, {houseStandard.clarity}.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Enquiry ───────────────────────────────────────────────────────── */}
      <section className="bg-ivory py-28 md:py-40">
        <div className="shell grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="Start a Commission"
              title="Tell us what you have in mind."
              body="The more you can tell us — the occasion, who will wear it, roughly what you would like to spend — the more useful our first reply will be."
            />
          </div>
          <Reveal delay={120}>
            <EnquiryForm kind="CUSTOM" showBudget showCategory />
          </Reveal>
        </div>
      </section>

      {/* ── Questions ─────────────────────────────────────────────────────── */}
      <section className="bg-stone/40 py-24 md:py-32">
        <div className="shell-narrow">
          <SectionHeading eyebrow="Questions" title="Asked often." />

          <dl className="mt-14 divide-y divide-graphite/12 border-y border-graphite/12">
            {ANSWERS.map((item, index) => (
              <Reveal key={item.q} delay={index * 80} className="py-8">
                <dt className="display-sm text-plum">{item.q}</dt>
                <dd className="measure mt-4 text-graphite/70">{item.a}</dd>
              </Reveal>
            ))}
          </dl>

          <Reveal delay={340}>
            <p className="mt-12 text-sm font-light text-graphite/55">
              Something not covered here?{" "}
              <a href={`mailto:${site.email}`} className="link-rule text-plum">
                Write to us directly
              </a>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
