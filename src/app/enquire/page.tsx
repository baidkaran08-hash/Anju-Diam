import type { Metadata } from "next";
import Link from "next/link";

import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import EnquiryForm from "@/components/EnquiryForm";
import { houseStandard, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Enquire",
  description:
    "Write to Anju Diam about a piece, a commission, sizing or a valuation. Every enquiry is answered by a person within one business day.",
};

/**
 * The enquiry form, on its own page.
 *
 * Split out of /contact, which now carries the house card. The two were the
 * same page, so someone who only wanted the address had to scroll past the
 * form to find it — and someone who wanted to write had no obvious link to
 * send a friend.
 */
export default function EnquirePage() {
  return (
    <>
      <PageHero
        eyebrow="Enquire"
        title="Write to the house."
        body="A question about a piece, a commission, a resize, or an honest opinion on a quote from somewhere else. All of it comes to the same desk."
        frame={112}
        compact
        breadcrumb={[{ href: "/", label: "Home" }]}
      />

      <section className="bg-ivory py-24 md:py-32">
        <div className="shell grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Reveal>
              <p className="label mb-6 text-wine">What to expect</p>
              <h2 className="display-md text-plum">One business day, from a person.</h2>
            </Reveal>

            <Reveal delay={100}>
              <ul className="mt-10 space-y-6 text-sm font-light leading-relaxed text-graphite/70">
                <li>
                  <strong className="font-medium text-plum">On a piece</strong> — availability,
                  sizing, an alternative metal, or the same design at a different budget.
                </li>
                <li>
                  <strong className="font-medium text-plum">On a commission</strong> — the first
                  reply comes back with sketches and a stone selection to consider.
                </li>
                <li>
                  <strong className="font-medium text-plum">On a valuation</strong> — bring us a
                  quote from anywhere else and we will tell you honestly whether it is a good one.
                </li>
              </ul>
            </Reveal>

            <Reveal delay={200}>
              <p className="mt-12 text-sm font-light leading-relaxed text-graphite/55">
                Everything we make is {houseStandard.metal}, {houseStandard.colour},{" "}
                {houseStandard.clarity}.
              </p>
              <p className="mt-6 text-sm font-light text-graphite/55">
                Prefer the address, the phone number or our socials?{" "}
                <Link href="/contact" className="link-rule text-plum">
                  They are on the contact card
                </Link>
                .
              </p>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <EnquiryForm showCategory showBudget heading="Send us a message" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
