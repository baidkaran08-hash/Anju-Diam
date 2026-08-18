"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/products", label: "Catalogue" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/orders", label: "Selections" },
];

export default function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <header className="mb-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="label mb-3 text-wine">Studio</p>
          <h1 className="display-md text-plum">Anju Diam</h1>
        </div>
        <p className="label-sm text-graphite/45">Signed in as {name}</p>
      </div>

      <nav aria-label="Studio" className="mt-9 flex flex-wrap gap-1 border-b border-graphite/12">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`label -mb-px border-b px-4 pb-4 pt-2 transition-colors ${
                active
                  ? "border-gold text-plum"
                  : "border-transparent text-graphite/40 hover:text-plum"
              }`}
            >
              {link.label}
            </Link>
          );
        })}

        <Link
          href="/"
          className="label-sm ml-auto self-center pb-4 pt-2 text-graphite/40 transition-colors hover:text-plum"
        >
          View the site ↗
        </Link>
      </nav>
    </header>
  );
}
