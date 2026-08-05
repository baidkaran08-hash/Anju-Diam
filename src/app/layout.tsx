import type { Metadata } from "next";
import "./globals.css";
import Cursor from "@/components/Cursor";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Anju Diam — Fine Diamond Jewellery",
    template: "%s · Anju Diam",
  },
  description:
    "Founded in Bangkok in 1993. Fine diamond jewellery in 18-karat gold, set with diamonds of G colour and VS clarity or better. Specialists in illusion settings.",
  openGraph: {
    title: "Anju Diam — A Legacy of Brilliance",
    description:
      "Three decades of fine diamond jewellery from Bangkok. Handcrafted, quality checked, and made yours.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Montserrat:wght@200;300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "JewelryStore",
              name: "Anju Diam Co., Ltd.",
              foundingDate: "1993",
              address: { "@type": "PostalAddress", addressLocality: "Bangkok", addressCountry: "TH" },
              slogan: "A Legacy of Brilliance",
            }),
          }}
        />
      </head>
      <body data-theme="dark">
        <Cursor />
        <SiteHeader />
        {children}
        <SiteFooter />
        <WhatsAppButton />
      </body>
    </html>
  );
}
