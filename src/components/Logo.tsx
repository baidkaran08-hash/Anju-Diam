import Image from "next/image";

/**
 * The house identity.
 *
 * Both the lotus mark and the wordmark are custom artwork — the faceted petals
 * and the swash on the leading A are drawn, not typeset — so they are used as
 * supplied rather than reproduced with a web font or traced by hand. An
 * approximation of a client's logo is worse than none.
 *
 * The three colourways are generated from a single plum master by
 * `npm run logo:build` (scripts/build-logo.ts), which also strips the soft
 * alpha fringe the originals carry and emits the favicon.
 */

export type LogoTone = "plum" | "ivory" | "gold";

const MARK = {
  plum: "/logo/mark-plum.webp",
  ivory: "/logo/mark-ivory.webp",
  gold: "/logo/mark-gold.webp",
} as const;

const WORDMARK = {
  plum: "/logo/wordmark-plum.webp",
  ivory: "/logo/wordmark-ivory.webp",
  gold: "/logo/wordmark-gold.webp",
} as const;

export const LOGO_TAGLINE = "A Legacy of Brilliance";

export function LotusMark({
  tone = "ivory",
  className = "",
  priority = false,
}: {
  tone?: LogoTone;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={MARK[tone]}
      alt=""
      aria-hidden
      width={391}
      height={286}
      priority={priority}
      className={className}
    />
  );
}

export function Wordmark({
  tone = "ivory",
  className = "",
  priority = false,
}: {
  tone?: LogoTone;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={WORDMARK[tone]}
      alt="Anju Diam"
      width={1200}
      height={150}
      priority={priority}
      className={className}
    />
  );
}

/**
 * Hairline divider with a small brilliant set into it.
 *
 * Deliberately not the lotus — a logo used as repeating page furniture stops
 * reading as a logo. This is a plain ornament that takes currentColor.
 */
export function DiamondRule({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 14" className={className} fill="none" aria-hidden focusable="false">
      <path d="M0 7 H86" stroke="currentColor" strokeWidth={0.8} opacity={0.45} />
      <path d="M114 7 H200" stroke="currentColor" strokeWidth={0.8} opacity={0.45} />
      <path d="M100 1.5 L106 7 L100 12.5 L94 7 Z" stroke="currentColor" strokeWidth={0.9} />
      <path d="M94 7 H106" stroke="currentColor" strokeWidth={0.55} opacity={0.65} />
    </svg>
  );
}

/** Horizontal lockup for the header. */
export function LogoCompact({
  tone = "ivory",
  className = "",
}: {
  tone?: LogoTone;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3.5 ${className}`}>
      <LotusMark tone={tone} priority className="h-7 w-auto shrink-0" />
      <Wordmark tone={tone} priority className="h-[15px] w-auto" />
    </span>
  );
}

/**
 * Stacked lockup — mark over wordmark over the line. Used wherever the
 * identity is presented rather than merely referenced: footer, loader.
 */
export default function Logo({
  tone = "ivory",
  className = "",
  showTagline = true,
}: {
  tone?: LogoTone;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <LotusMark tone={tone} className="mb-6 h-14 w-auto" />
      <Wordmark tone={tone} className="h-6 w-auto md:h-7" />
      {showTagline && (
        <span className="label-sm mt-4 opacity-60" style={{ letterSpacing: "0.38em" }}>
          {LOGO_TAGLINE}
        </span>
      )}
    </span>
  );
}
