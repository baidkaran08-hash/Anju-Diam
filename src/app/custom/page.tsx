import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom jewellery",
  description:
    "Customisation is central to our philosophy. Nearly every piece can be adapted — metal, stone size, setting, length.",
};

const STEPS = [
  ["01", "Tell us the idea", "An occasion, a budget range, a piece you already love, or a sketch on a napkin. Anything is a starting point."],
  ["02", "We come back with options", "Materials, stone options within the house standard, timing and an honest price. No obligation at this stage."],
  ["03", "Design and approval", "Renders and adjustments until the piece is right. Nothing is cut until you have signed off."],
  ["04", "Crafted and checked", "Handcrafted in our Bangkok atelier, then individually quality-checked before it leaves us."],
];

export default function CustomPage() {
  return (
    <main>
      <section className="bg-ivory text-charcoal">
        <div className="mx-auto max-w-[1360px] px-6 pb-24 pt-40 md:px-12 md:py-36 md:pt-48">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
            <div>
              <span className="label text-wine">Custom jewellery</span>
              <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(30px,4.6vw,62px)] leading-[1.06] tracking-tight text-plum">
                Made yours, from sketch to setting
              </h1>
            </div>
            <p className="max-w-[40ch] text-sm leading-[1.78] text-charcoal/70">
              Customisation is central to our philosophy. Nearly every piece can be adapted — metal,
              stone size, setting, length.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map(([number, heading, body]) => (
              <div key={number} className="glass rounded-2xl p-7">
                <b className="block font-display text-[26px] font-normal text-gold">{number}</b>
                <h3 className="mt-4 font-display text-[19px] text-plum">{heading}</h3>
                <p className="mt-3 text-[13.5px] leading-[1.75] text-charcoal/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-plum text-ivory">
        <div className="mx-auto max-w-[1360px] px-6 py-24 md:px-12 md:py-36">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
            <div>
              <span className="label text-gold">The house standard</span>
              <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(30px,4.4vw,58px)] leading-[1.06] tracking-tight">
                What every commission is held to
              </h2>
            </div>
            <p className="max-w-[40ch] text-sm leading-[1.78] text-ivory/70">
              These do not change, whatever the design.
            </p>
          </div>

          <dl className="flex flex-wrap gap-8">
            {[
              ["G+", "Colour"],
              ["VS+", "Clarity"],
              ["18K", "Gold"],
              ["1993", "Since"],
            ].map(([value, key]) => (
              <div key={key} className="min-w-24 border-t border-gold/40 pt-3">
                <dd className="font-display text-[clamp(19px,1.9vw,26px)]">{value}</dd>
                <dt className="label mt-2 text-taupe">{key}</dt>
              </div>
            ))}
          </dl>

          <Link
            href="/contact"
            className="label mt-12 inline-flex border border-gold px-8 py-4 text-gold transition-colors hover:bg-gold hover:text-ink"
          >
            Begin a commission
          </Link>
        </div>
      </section>
    </main>
  );
}
