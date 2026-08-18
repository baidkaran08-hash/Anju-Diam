import Link from "next/link";

import Logo, { DiamondRule } from "@/components/Logo";
import { footerNav, site, houseStandard, social } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer data-nav-tone="light" className="grain relative bg-ink text-ivory">
      <div className="shell py-20 md:py-28">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo tone="ivory" className="items-start text-left" />
            <p className="measure mt-8 text-sm font-light leading-relaxed text-ivory/55">
              {site.tagline} Fine natural diamond jewellery handcrafted in {site.city} since{" "}
              {site.founded}, in {houseStandard.metal} and set to a house standard of{" "}
              {houseStandard.colour} and {houseStandard.clarity}.
            </p>

            <address className="mt-8 not-italic text-sm font-light leading-relaxed text-ivory/45">
              {site.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <a href={`mailto:${site.email}`} className="link-rule mt-3 inline-block text-ivory/70 hover:text-gold">
                {site.email}
              </a>
              <a href={`tel:${site.phoneE164}`} className="link-rule mt-1 block text-ivory/70 hover:text-gold">
                {site.phoneDisplay}
              </a>
              <span className="mt-4 flex gap-4">
                {social.map((channel) => (
                  <a
                    key={channel.key}
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-sm text-ivory/55 transition-colors hover:text-gold"
                  >
                    {channel.label}
                  </a>
                ))}
              </span>
            </address>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footerNav.map((group) => (
              <nav key={group.heading} aria-label={group.heading}>
                <h2 className="label mb-6 text-gold">{group.heading}</h2>
                <ul className="space-y-3.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-light text-ivory/55 transition-colors duration-500 hover:text-gold"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <DiamondRule className="mx-auto mt-20 h-3 w-40 text-gold/50" />

        <div className="mt-10 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="label-sm text-ivory/35">
            © {new Date().getFullYear()} {site.legalName}
          </p>
          <p className="label-sm text-ivory/35">
            {site.city}, {site.country} · Established {site.founded}
          </p>
        </div>
      </div>
    </footer>
  );
}
