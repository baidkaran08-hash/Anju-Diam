import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Founded in Bangkok in 1993 by Sanjay Kothari. Three decades of fine diamond jewellery built on knowledge before craftsmanship.",
};

const FOUNDERS = [
  {
    year: "1993",
    name: "Sanjay Kothari",
    role: "Founder",
    text: "Founded the house in Bangkok after years trading loose diamonds — building an understanding of quality, grading, pricing and sourcing before a single piece was ever made.",
  },
  {
    year: "2011",
    name: "Ayushi Khater",
    role: "Design",
    text: "Brought a contemporary design sensibility that reached a younger client, while holding on to the craftsmanship and authenticity the house was built on.",
  },
  {
    year: "2020",
    name: "Akshay Kothari",
    role: "Brand & Growth",
    text: "Focused on branding, marketing and innovation — positioning the house for global growth without letting go of its heritage.",
  },
];

// Verbatim from the client's own write-up. Nothing here is invented.
const STORY = [
  "Founded in 1993 by Sanjay Kothari, Anju Diam Co., Ltd. was built on knowledge before craftsmanship. Beginning as a trader of loose diamonds, Sanjay Kothari dedicated years to understanding every facet of a diamond — its quality, grading, brilliance, and value. This pursuit of excellence laid the foundation for what would become a trusted name in fine diamond jewellery.",
  "As expertise grew, so did the vision. Through extensive research into precious gemstones, precious metals, and evolving jewellery design, the company expanded into creating exquisite fine jewellery that seamlessly blends timeless elegance with contemporary sophistication.",
  "Today, the company embodies the philosophy of quiet luxury — pieces that speak through exceptional craftsmanship rather than excess. Our designs are refined, versatile, and created for those who appreciate understated elegance. While our values remain rooted in tradition, our approach continues to evolve with the lifestyles and tastes of each new generation.",
  "Every creation is thoughtfully crafted in 18-karat gold and set with carefully selected diamonds of G colour or higher and VS clarity or above. We believe exceptional jewellery begins with exceptional materials, which is why every diamond is chosen for its brilliance, purity, and beauty without compromise.",
  "Our expertise in fine diamond jewellery and illusion settings allows us to create pieces that maximise light, brilliance, and visual impact while maintaining elegance and wearability. From timeless classics to contemporary designs, every piece reflects precision, artistry, and meticulous attention to detail.",
  "At Anju Diam Co., Ltd., luxury is also personal. We understand that every client has a unique vision, which is why customisation is central to our philosophy. Whether reimagining a classic silhouette or bringing a bespoke design to life, we work closely with every client to create jewellery that is deeply personal and enduring.",
  "For more than three decades, Anju Diam Co., Ltd. has remained committed to one promise: delivering uncompromising quality, honest value, and timeless craftsmanship. Every piece is designed to celebrate life's most meaningful moments and become an heirloom that will be cherished for generations.",
];

export default function AboutPage() {
  return (
    <main>
      <section className="bg-ivory text-charcoal">
        <div className="mx-auto max-w-[1360px] px-6 pb-24 pt-40 md:px-12 md:py-36 md:pt-48">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
            <div>
              <span className="label text-wine">About the house</span>
              <h1 className="mt-4 font-display text-[clamp(30px,4.6vw,62px)] leading-[1.06] tracking-tight text-plum">
                Our story
              </h1>
            </div>
            <p className="max-w-[40ch] text-sm leading-[1.78] text-charcoal/70">
              Founded in Bangkok in 1993. Three decades of fine diamond jewellery built on knowledge
              first.
            </p>
          </div>

          <div className="max-w-[62ch] text-[15.5px] leading-[1.85] text-charcoal/85">
            <p className="font-display text-[clamp(20px,2.3vw,30px)] italic leading-[1.4] text-plum">
              True luxury begins with uncompromising quality.
            </p>
            {STORY.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-6">
                {paragraph}
              </p>
            ))}
            <p className="mt-8 font-display text-[clamp(20px,2.3vw,30px)] italic leading-[1.4] text-plum">
              Because true luxury is never loud — it is crafted with purpose, worn with confidence, and
              treasured forever.
            </p>
          </div>
        </div>
      </section>

      <section id="founders" className="bg-plum text-ivory">
        <div className="mx-auto max-w-[1360px] px-6 py-24 md:px-12 md:py-36">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
            <div>
              <span className="label text-gold">Our founders</span>
              <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(30px,4.4vw,58px)] leading-[1.06] tracking-tight">
                The people behind the house
              </h2>
            </div>
            <p className="max-w-[40ch] text-sm leading-[1.78] text-ivory/70">
              One founder, then two more points of view — each arriving when the house needed them.
            </p>
          </div>

          <div className="border-t border-gold/30">
            {FOUNDERS.map((entry) => (
              <article
                key={entry.year}
                className="grid grid-cols-[76px_1fr] items-baseline gap-x-8 gap-y-4 border-b border-gold/20 py-8 md:grid-cols-[120px_1fr_minmax(0,46ch)] md:py-10"
              >
                <span className="font-display text-[clamp(24px,2.4vw,34px)] leading-none text-gold">
                  {entry.year}
                </span>
                <h3 className="font-display text-[clamp(19px,1.9vw,27px)] tracking-tight">
                  {entry.name}
                  <small className="label mt-2 block text-taupe">{entry.role}</small>
                </h3>
                <p className="col-start-2 text-sm leading-[1.8] text-ivory/75 md:col-start-3">
                  {entry.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
