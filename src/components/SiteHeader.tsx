"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LogoCompact } from "@/components/Logo";
import { primaryNav, categories } from "@/lib/site";
import { useCart } from "@/components/CartProvider";
import CurrencySwitcher from "@/components/CurrencySwitcher";

/**
 * Site chrome.
 *
 * The bar is transparent on every page and at every scroll position — no plate,
 * no fill. It used to drop a frosted plum plate the moment you scrolled, which
 * meant the site opened light and airy and then went dark the instant you
 * moved.
 *
 * Transparency alone would be unreadable over the plum and ink bands, so the
 * bar reads what is beneath it instead: sections carrying `data-nav-tone`
 * declare that they need light type, and the bar switches between wine and
 * ivory as it passes over them, with a matching halo doing the legibility work.
 * Nothing is ever laid over the page.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  /** "dark" = dark type on a light ground; "light" = light type on a dark one. */
  const [tone, setTone] = useState<"dark" | "light">("dark");

  /**
   * Pick the type colour from whatever band the bar is currently over.
   *
   * Rects are read live rather than cached: they move as images decode, fonts
   * swap and the catalogue grid fills in, and a stale cache would leave the bar
   * the wrong colour exactly where it is least readable. Eight
   * getBoundingClientRect calls per scroll event is nothing.
   */
  useEffect(() => {
    const probe = 34; // roughly the vertical centre of the bar

    const read = () => {
      const bands = document.querySelectorAll<HTMLElement>("[data-nav-tone]");
      let next: "dark" | "light" = "dark";

      for (const band of bands) {
        const rect = band.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom >= probe) {
          next = band.dataset.navTone === "light" ? "light" : "dark";
          break;
        }
      }
      setTone(next);
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read, { passive: true });
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [pathname]);

  // A route change should never leave the mobile sheet open behind the new page.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // The mobile sheet is a plum panel, so the bar sits on it in ivory whatever
  // is underneath the page.
  const light = menuOpen || tone === "light";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] transition-colors duration-500 ${
          light ? "on-film-dark text-ivory" : "on-film text-wine"
        }`}
      >
        <div className="shell flex items-center justify-between gap-6 py-4 md:py-5">
          <Link href="/" aria-label="Anju Diam — home" className="shrink-0">
            <LogoCompact tone={light ? "ivory" : "plum"} />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
            {primaryNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`label link-rule transition-colors duration-500 ${
                    active ? "text-gold" : "hover:text-gold"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-5">
            <CurrencySwitcher />

            <Link href="/search" aria-label="Search the collections" className="hidden transition-colors hover:text-gold sm:block">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.6-3.6" strokeLinecap="round" />
              </svg>
            </Link>

            <Link href="/wishlist" aria-label="Saved pieces" className="hidden transition-colors hover:text-gold sm:block">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link href="/account" aria-label="My account" className="hidden transition-colors hover:text-gold sm:block">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <circle cx="12" cy="8.5" r="3.6" />
                <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" strokeLinecap="round" />
              </svg>
            </Link>

            <Link
              href="/cart"
              aria-label={`Your selection, ${count} ${count === 1 ? "piece" : "pieces"}`}
              className="relative transition-colors hover:text-gold"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <path d="M5 8h14l-1.1 11.2a1.6 1.6 0 0 1-1.6 1.4H7.7a1.6 1.6 0 0 1-1.6-1.4Z" strokeLinejoin="round" />
                <path d="M8.8 8V6.4a3.2 3.2 0 0 1 6.4 0V8" strokeLinecap="round" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-2.5 -top-2 grid h-4 min-w-4 place-content-center rounded-full bg-gold px-1 text-[9px] font-semibold text-ink">
                  {count}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <span className="relative block h-3.5 w-6">
                <span
                  className={`absolute left-0 block h-px w-full bg-current transition-all duration-500 ${
                    menuOpen ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-full bg-current transition-all duration-500 ${
                    menuOpen ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[95] text-ivory transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        // Only claims the tone while it is actually open. The sheet is
        // fixed inset-0, so leaving this set would put a full-viewport "light"
        // band under the probe on every phone and pin the bar to ivory.
        data-nav-tone={menuOpen ? "light" : undefined}
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-plum) 88%, transparent)",
          backdropFilter: "blur(28px) saturate(150%)",
          WebkitBackdropFilter: "blur(28px) saturate(150%)",
        }}
      >
        <div className="shell flex h-full flex-col justify-center gap-10 pt-20">
          <nav aria-label="Mobile" className="flex flex-col gap-5">
            {primaryNav.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="display-md hover:text-gold"
                style={{
                  transitionDelay: `${index * 60}ms`,
                  transform: menuOpen ? "none" : "translateY(14px)",
                  opacity: menuOpen ? 1 : 0,
                  transition: "opacity .7s, transform .7s",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hairline pt-8">
            <p className="label mb-5 text-gold">Collections</p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/collections/${category.slug}`}
                  className="text-sm font-light text-ivory/70 transition-colors hover:text-gold"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hairline flex items-center gap-6 pt-8">
            <CurrencySwitcher compact />
            <Link href="/search" className="label text-ivory/70 hover:text-gold">Search</Link>
            <Link href="/wishlist" className="label text-ivory/70 hover:text-gold">Saved</Link>
            <Link href="/account" className="label text-ivory/70 hover:text-gold">Account</Link>
          </div>
        </div>
      </div>
    </>
  );
}
