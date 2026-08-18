import type { Metadata } from "next";
import Link from "next/link";

import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Logo, { DiamondRule } from "@/components/Logo";
import { openingHours, site, social, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Visit or write to ${site.legalName} in ${site.city}. Address, telephone, email and social channels.`,
};

/**
 * The house card.
 *
 * Deliberately not a form. Contact and Enquire used to land on the same page,
 * which meant a visitor who simply wanted the address had to read past a
 * six-field form to find it. This page is the card — where we are, how to reach
 * us — and /enquire is where you write to us. Each links to the other.
 */
export default function ContactPage() {
  const whatsapp = whatsappHref();

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Come and see them."
        body="Diamonds are difficult to judge on a screen. If you are in Bangkok, the door is open — and if you are not, we will send whatever you need to decide."
        frame={54}
        compact
        breadcrumb={[{ href: "/", label: "Home" }]}
      />

      <section className="bg-ivory py-24 md:py-32">
        <div className="shell grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* ── The card ────────────────────────────────────────────────── */}
          <Reveal>
            <div className="glass-light glass-r overflow-hidden">
              <div className="grain bg-plum px-9 py-12 text-center text-ivory md:px-14">
                <Logo tone="ivory" />
              </div>

              <div className="px-9 py-11 md:px-14">
                <dl className="space-y-9">
                  <Row term="Atelier">
                    <address className="not-italic leading-relaxed">
                      {site.addressLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                      <span className="mt-2 block text-graphite/50">Visits by appointment</span>
                    </address>
                  </Row>

                  <Row term="Telephone">
                    <a href={`tel:${site.phoneE164}`} className="link-rule text-plum">
                      {site.phoneDisplay}
                    </a>
                  </Row>

                  <Row term="Email">
                    <a href={`mailto:${site.email}`} className="link-rule text-plum">
                      {site.email}
                    </a>
                  </Row>

                  <Row term="Website">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-rule text-plum"
                    >
                      {site.domain}
                    </a>
                  </Row>

                  {whatsapp && (
                    <Row term="WhatsApp">
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-rule text-plum"
                      >
                        Message the house
                      </a>
                    </Row>
                  )}

                  <Row term="Social">
                    <ul className="space-y-2">
                      {social.map((channel) => (
                        <li key={channel.key}>
                          <a
                            href={channel.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-rule text-plum"
                          >
                            <span className="text-graphite/45">{channel.label}</span>{" "}
                            {channel.handle}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Row>

                  <Row term="Hours">
                    <ul className="space-y-1.5">
                      {openingHours.map((slot) => (
                        <li key={slot.days} className="flex justify-between gap-6 tabular-nums">
                          <span>{slot.days}</span>
                          <span className="text-graphite/55">{slot.hours}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs font-light text-graphite/45">
                      Indochina Time (GMT+7). Showroom visits by appointment.
                    </p>
                  </Row>
                </dl>
              </div>
            </div>
          </Reveal>

          {/* ── Where to go next ────────────────────────────────────────── */}
          <div className="lg:pt-8">
            <Reveal delay={120}>
              <p className="label mb-6 text-wine">Rather write?</p>
              <h2 className="display-md text-plum">
                Tell us what you are looking for and we will answer properly.
              </h2>
              <p className="measure mt-6 body-lg text-graphite/70">
                Every enquiry is read and answered by a person, within one business day. If it is a
                commission, the first reply comes back with sketches and a stone selection.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/enquire" className="btn-gold">
                  Make an enquiry
                </Link>
                <Link href="/custom" className="btn-outline text-plum">
                  Start a commission
                </Link>
              </div>
            </Reveal>

            <Reveal delay={220}>
              <DiamondRule className="mt-16 h-3 w-36 text-gold" />
              <h3 className="display-sm mt-10 text-plum">Visiting the atelier</h3>
              <p className="measure mt-4 text-sm font-light leading-relaxed text-graphite/65">
                We keep the stones in the safe rather than the window, so it is worth telling us
                roughly what you would like to see before you come. Give us a day&rsquo;s notice and
                we will have a tray ready.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-graphite/10 pb-7 last:border-0 last:pb-0">
      <dt className="label-sm mb-3 text-graphite/40">{term}</dt>
      <dd className="text-sm font-light text-graphite">{children}</dd>
    </div>
  );
}
