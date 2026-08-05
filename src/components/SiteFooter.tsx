import Link from "next/link";

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      ["Rings", "/collections/rings"],
      ["Earrings", "/collections/earrings"],
      ["Necklaces", "/collections/necklaces"],
      ["Bracelets", "/collections/bracelets"],
      ["Bridal", "/collections/bridal"],
    ],
  },
  {
    heading: "House",
    links: [
      ["Our story", "/about"],
      ["Founders", "/about#founders"],
      ["Custom jewellery", "/custom"],
    ],
  },
  {
    heading: "Care",
    links: [
      ["Contact", "/contact"],
      ["Sizing", "/contact"],
      ["Shipping & returns", "/contact"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-20 bg-charcoal text-stone">
      <div className="mx-auto max-w-[1360px] px-6 pb-12 pt-16 md:px-12">
        <div className="flex flex-wrap justify-between gap-9 border-b border-ivory/15 pb-10">
          <div>
            <img
              src="/logo/lockup-gold.webp"
              alt="Anju Diam — A Legacy of Brilliance"
              width={900}
              height={371}
              className="w-[min(300px,62vw)] h-auto"
            />
          </div>
          <div className="flex flex-wrap gap-10 md:gap-20">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <span className="label mb-4 block text-gold">{column.heading}</span>
                {column.links.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="block text-[13.5px] leading-[2.1] text-ivory/70 transition-colors hover:text-gold"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="label flex flex-wrap justify-between gap-5 pt-7 text-ivory/40">
          <span>© 1993–2026 Anju Diam Co., Ltd.</span>
          <span>Bangkok · Thailand</span>
        </div>
      </div>
    </footer>
  );
}
