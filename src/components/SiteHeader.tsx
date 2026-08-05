"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/custom", label: "Custom" },
  { href: "/contact", label: "Contact" },
];

/**
 * The masthead never fills. It stays transparent at every scroll position so
 * the hero film is not cut by a bar sliding over it. Legibility comes from a
 * glass pill around the links plus a text shadow on the wordmark — not from a
 * background. Only the ink colour changes, driven by the page's theme.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Home is the only dark-themed route; the rest sit on ivory.
  const theme = pathname === "/" ? "dark" : "light";

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="masthead">
      <Link href="/" className="brand" aria-label="Anju Diam, a legacy of brilliance — home">
        {/* Two colourways rather than a CSS filter, so the artwork's own
            antialiasing is preserved at small sizes. */}
        <span className="brand-lock on-dark" aria-hidden>
          <img src="/logo/mark-gold.webp" alt="" width={340} height={259} />
          <img src="/logo/wordmark-ivory.webp" alt="" width={1000} height={142} />
        </span>
        <span className="brand-lock on-light" aria-hidden>
          <img src="/logo/mark-plum.webp" alt="" width={340} height={259} />
          <img src="/logo/wordmark-plum.webp" alt="" width={1000} height={142} />
        </span>
      </Link>

      <button
        type="button"
        className="nav-toggle glass"
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>

      <nav id="primary-nav" className={`nav glass ${open ? "is-open" : ""}`} aria-label="Primary">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname.startsWith(link.href) ? "is-current" : ""}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/contact" className="nav-cta">
          Enquire
        </Link>
      </nav>
    </header>
  );
}
