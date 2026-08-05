import EnquiryForm from "@/components/EnquiryForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell us what you have in mind. We reply within two business days.",
};

const BLOCKS = [
  ["Atelier", "Anju Diam Co., Ltd.\nBangkok, Thailand"],
  ["The house standard", "18-karat gold. Diamonds of G colour or higher, VS clarity or above. Every piece individually quality-checked before it leaves us."],
  ["Customisation", "Nearly every piece can be adapted — metal, stone size, setting, length. Ask, and we will tell you what is possible."],
];

export default function ContactPage() {
  return (
    <main className="bg-ivory text-charcoal">
      <div className="mx-auto max-w-[1360px] px-6 pb-24 pt-40 md:px-12 md:py-36 md:pt-48">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
          <div>
            <span className="label text-wine">Contact</span>
            <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(30px,4.6vw,62px)] leading-[1.06] tracking-tight text-plum">
              Start with a conversation
            </h1>
          </div>
          <p className="max-w-[40ch] text-sm leading-[1.78] text-charcoal/70">
            Tell us what you have in mind. We will come back with materials, timing and an honest price.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2 md:gap-20">
          <EnquiryForm />
          <div>
            <div className="mb-8 border-t border-plum/20 pt-7">
              <span className="label mb-3 block text-wine">Written enquiries</span>
              <p className="text-[15px] leading-[1.8]">
                <a href="mailto:hello@anjudiam.com" className="border-b border-gold/70">
                  hello@anjudiam.com
                </a>
              </p>
            </div>
            {BLOCKS.map(([heading, body]) => (
              <div key={heading} className="mb-8 border-t border-plum/20 pt-7">
                <span className="label mb-3 block text-wine">{heading}</span>
                <p className="whitespace-pre-line text-[15px] leading-[1.8]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
