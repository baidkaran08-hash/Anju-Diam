import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { cookies } from "next/headers";

import "./globals.css";
import { site, social } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Cursor from "@/components/Cursor";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/components/CartProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { getRates } from "@/lib/rates";
import { COOKIE_NAME, DEFAULT_CURRENCY, isCurrency } from "@/lib/currency";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Fine Diamond Jewellery`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — Fine Diamond Jewellery`,
    description: site.description,
    type: "website",
    locale: "en_US",
    siteName: site.name,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#4F243C",
  colorScheme: "light",
};

/** Rich result for the business itself — worth having on a brand-led site. */
const organisationJsonLd = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: site.legalName,
  description: site.description,
  foundingDate: String(site.founded),
  founder: { "@type": "Person", name: site.founder },
  url: site.url,
  email: site.email,
  telephone: site.phoneE164,
  sameAs: social.map((channel) => channel.href),
  address: {
    "@type": "PostalAddress",
    addressLocality: site.city,
    addressCountry: site.country,
  },
  slogan: site.tagline,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Both resolved on the server so the first paint is already in the visitor's
  // currency — reading the cookie on the client would flash baht then flip.
  const [store, rates] = await Promise.all([cookies(), getRates()]);
  const cookieValue = store.get(COOKIE_NAME)?.value;
  const currency = isCurrency(cookieValue) ? cookieValue : DEFAULT_CURRENCY;

  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable}`}>
      <body>
        <a
          href="#main"
          className="label sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[200] focus:bg-gold focus:px-5 focus:py-3 focus:text-ink"
        >
          Skip to content
        </a>

        <CurrencyProvider initialCurrency={currency} rates={rates}>
          <CartProvider>
            <Cursor />
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
            <WhatsAppButton />
          </CartProvider>
        </CurrencyProvider>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }}
        />
      </body>
    </html>
  );
}
