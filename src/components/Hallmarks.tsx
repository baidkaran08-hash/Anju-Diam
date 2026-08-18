import Link from "next/link";

import Reveal from "@/components/Reveal";
import { DiamondRule } from "@/components/Logo";
import { HALLMARKS } from "@/components/HallmarkIcons";
import { houseStandard } from "@/lib/site";

/**
 * The house hallmarks.
 *
 * Sits late on the home page on purpose. By this point the visitor has seen the
 * film, the collections and a price, and the question in their head has moved
 * from "is this beautiful" to "can I trust these people and is this a fair
 * price". This section answers exactly that, and nothing else.
 *
 * Plum ground, because that is how the client's own brand-icon sheet presents
 * them.
 */
export default function Hallmarks() {
  return (
    <section data-nav-tone="light" className="grain relative bg-plum py-28 text-ivory md:py-36">
      <div className="shell">
        <div className="text-center">
          <Reveal>
            <p className="label mb-6 text-gold">The House Hallmarks</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display-lg mx-auto max-w-3xl">
              What you are paying for, and what you are not.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="measure mx-auto mt-7 body-lg text-ivory/65">
              Every piece is {houseStandard.metal}, {houseStandard.colour},{" "}
              {houseStandard.clarity} — and priced against its actual weight. There is no
              showroom markup, no premium for the name on the box, and nothing in the quote you
              cannot see on the certificate.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <DiamondRule className="mx-auto mt-12 h-3 w-40 text-gold/60" />
          </Reveal>
        </div>

        <ul className="mt-20 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {HALLMARKS.map((hallmark, index) => (
            <Reveal
              key={hallmark.key}
              as="li"
              delay={index * 70}
              className="text-center sm:text-left"
            >
              <hallmark.Icon className="mx-auto h-14 w-14 text-gold sm:mx-0" />
              <h3 className="display-sm mt-6 text-ivory">{hallmark.label}</h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-ivory/60">
                {hallmark.body}
              </p>
            </Reveal>
          ))}

          {/* Fills the eighth cell on a four-up grid rather than leaving a hole. */}
          <Reveal as="li" delay={HALLMARKS.length * 70} className="text-center sm:text-left">
            <p className="label mb-5 text-gold">Still deciding?</p>
            <p className="text-sm font-light leading-relaxed text-ivory/60">
              Bring us a quote from anywhere else and we will tell you honestly whether it is a
              good one.
            </p>
            <Link href="/enquire" className="label link-rule mt-6 inline-block text-gold">
              Ask us
            </Link>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
