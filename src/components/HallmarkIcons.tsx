/**
 * The house hallmarks.
 *
 * Redrawn from the client's brand-icon sheet as SVG rather than cropped out of
 * it. The sheet is a 1280px JPEG in which each icon is roughly 90px square —
 * far too small to display at 56px on a retina screen, and its thin strokes
 * carry JPEG fringing against the plum. Vectors stay crisp at any size, take
 * currentColor, and cost nothing to serve.
 *
 * Seven of the eight are here. The second icon on the sheet is struck through,
 * which is read as "not this one".
 *
 * Every icon is drawn on a 48x48 grid with a 1.4 stroke, so they sit together
 * at the same optical weight.
 */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: "false" as const,
};

/**
 * A faceted lotus — the mark drawn in straight edges, so it reads as cut and
 * set rather than grown. Deliberately geometric to hold it apart from the
 * softer Purity lotus; on the client's sheet the two are distinguished the
 * same way.
 */
export function LegacyIcon({ className }: IconProps) {
  const petal = (angle: number, length: number, width: number) => (
    <g key={angle} transform={`rotate(${angle})`}>
      <path
        d={`M0 0 L${-width} ${-length * 0.56} L0 ${-length} L${width} ${-length * 0.56} Z`}
      />
      <path d={`M0 0 L0 ${-length}`} opacity={0.75} />
      <path d={`M${-width} ${-length * 0.56} L${width} ${-length * 0.56}`} opacity={0.6} />
    </g>
  );

  return (
    <svg {...base} className={className}>
      <g transform="translate(24 35)">
        {petal(-66, 20, 5)}
        {petal(66, 20, 5)}
        {petal(-34, 23.5, 5.6)}
        {petal(34, 23.5, 5.6)}
        {petal(0, 26.5, 6.2)}
      </g>
    </svg>
  );
}

/**
 * Cupped hands under a star. The client's sheet angles a single hand up to the
 * right; a centred cup reads more clearly at 56px and carries the same idea —
 * something valuable being held for you rather than sold at you.
 */
export function TrustIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m24 9.5 2 4.2 4.6.7-3.3 3.3.8 4.6-4.1-2.2-4.1 2.2.8-4.6-3.3-3.3 4.6-.7z" />
      <path d="M9 26.5c0 8.3 6.7 15 15 15s15-6.7 15-15" />
      <path d="M14 26.5c0 5.5 4.5 10 10 10s10-4.5 10-10" opacity={0.6} />
      {/* Thumbs. Without these the cup reads as a bowl rather than as hands. */}
      <path d="M9 26.5c0-2.4 2-4.4 4.4-4.4M39 26.5c0-2.4-2-4.4-4.4-4.4" />
      <path d="M24 41.5v-5" opacity={0.5} />
    </svg>
  );
}

/** A soft lotus in bloom — purity of metal and stone. */
export function PurityIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M24 10c-2.7 3.2-4 6.8-4 10.7 0 3.9 1.3 7.5 4 10.7 2.7-3.2 4-6.8 4-10.7 0-3.9-1.3-7.5-4-10.7Z" />
      <path d="M15.6 15.5c-1.5 3.5-1.5 7 0 10.4 1.5 3.4 4.3 5.8 8.4 7.2-1-4.1-2.6-7.5-4.7-10.2-1.3-1.7-2.5-3.4-3.7-7.4Z" />
      <path d="M32.4 15.5c1.5 3.5 1.5 7 0 10.4-1.5 3.4-4.3 5.8-8.4 7.2 1-4.1 2.6-7.5 4.7-10.2 1.3-1.7 2.5-3.4 3.7-7.4Z" />
      <path d="M7 23.8c1.3 3.6 3.6 6.3 6.9 8.1 3.3 1.8 6.8 2.4 10.1 1.9-2.8-3.1-5.9-5.3-9.3-6.7-2.2-.9-4.4-1.7-7.7-3.3Z" />
      <path d="M41 23.8c-1.3 3.6-3.6 6.3-6.9 8.1-3.3 1.8-6.8 2.4-10.1 1.9 2.8-3.1 5.9-5.3 9.3-6.7 2.2-.9 4.4-1.7 7.7-3.3Z" />
    </svg>
  );
}

/** The scalloped seal, used as the frame for the monogram and the check. */
function Seal() {
  return (
    <path d="M24 5.6c1.5 0 2.9 1.5 4.5 1.9 1.6.4 3.6-.3 5 .6 1.4.9 1.6 3 2.7 4.2 1.1 1.2 3.2 1.7 3.9 3.2.7 1.5-.2 3.4 0 5 .2 1.6 1.6 3.2 1.4 4.8-.2 1.6-2 2.8-2.6 4.3-.6 1.5-.2 3.5-1.2 4.8-1 1.3-3.1 1.4-4.4 2.4-1.3 1-2 3-3.5 3.6-1.5.6-3.3-.4-4.9-.2-1.6.2-3.2 1.6-4.8 1.4-1.6-.2-2.7-2-4.2-2.7-1.5-.7-3.5-.3-4.7-1.4-1.2-1.1-1.2-3.2-2.1-4.6-.9-1.4-2.9-2.2-3.4-3.7-.5-1.5.6-3.3.6-4.9 0-1.6-1.1-3.4-.6-4.9.5-1.5 2.5-2.3 3.4-3.7.9-1.4.9-3.5 2.1-4.6 1.2-1.1 3.2-.7 4.7-1.4 1.5-.7 2.6-2.5 4.2-2.7 1.6-.2 3.2 1.2 4.8 1.4Z" />
  );
}

/** The lotus mark inside the house seal. */
export function MonogramIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <Seal />
      <path d="M24 16.4c-1.7 2-2.5 4.2-2.5 6.6s.8 4.6 2.5 6.6c1.7-2 2.5-4.2 2.5-6.6s-.8-4.6-2.5-6.6Z" />
      <path d="M18.8 19.8c-.9 2.2-.9 4.3 0 6.4.9 2.1 2.7 3.6 5.2 4.4-.6-2.5-1.6-4.6-2.9-6.3-.8-1-1.5-2.1-2.3-4.5Z" />
      <path d="M29.2 19.8c.9 2.2.9 4.3 0 6.4-.9 2.1-2.7 3.6-5.2 4.4.6-2.5 1.6-4.6 2.9-6.3.8-1 1.5-2.1 2.3-4.5Z" />
      <path d="M14.4 24.9c.8 2.2 2.2 3.9 4.3 5 2 1.1 4.2 1.5 6.2 1.2-1.7-1.9-3.6-3.3-5.7-4.1-1.4-.6-2.7-1.1-4.8-2.1Z" />
      <path d="M33.6 24.9c-.8 2.2-2.2 3.9-4.3 5-2 1.1-4.2 1.5-6.2 1.2 1.7-1.9 3.6-3.3 5.7-4.1 1.4-.6 2.7-1.1 4.8-2.1Z" />
    </svg>
  );
}

/** A check inside the house seal — every piece inspected. */
export function QualityIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <Seal />
      <path d="m17.6 24.2 4.6 4.6 8.2-8.2" strokeWidth={1.8} />
    </svg>
  );
}

/** A rosette with ribbons — the house certificate. */
export function CertifiedIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="24" cy="19.4" r="11.4" />
      <circle cx="24" cy="19.4" r="8" />
      <path d="m24 13.9 1.7 3.4 3.8.5-2.7 2.7.6 3.7-3.4-1.8-3.4 1.8.6-3.7-2.7-2.7 3.8-.5z" />
      <path d="m17.2 29.2-3.6 11 5.9-2.7 3.2 4.9M30.8 29.2l3.6 11-5.9-2.7-3.2 4.9" />
    </svg>
  );
}

/** Balance scales — weighed honestly, priced honestly. */
export function FairWeightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M24 8.6v30.2M14.2 12.6h19.6M18.4 41.4h11.2" />
      <circle cx="24" cy="10.6" r="1.6" />
      <path d="M14.2 12.6 8.4 26.4h11.6zM33.8 12.6 28 26.4h11.6z" />
      <path d="M8.4 26.4c0 3 2.6 5.4 5.8 5.4s5.8-2.4 5.8-5.4M28 26.4c0 3 2.6 5.4 5.8 5.4s5.8-2.4 5.8-5.4" />
    </svg>
  );
}

export type Hallmark = {
  key: string;
  label: string;
  body: string;
  Icon: (props: IconProps) => React.JSX.Element;
};

/**
 * Copy is written to answer the two questions a first-time buyer actually has:
 * can I trust the quality, and am I paying a fair price.
 */
export const HALLMARKS: Hallmark[] = [
  {
    key: "legacy",
    label: "Legacy",
    body: "Three decades of natural diamond knowledge, from a loose-stone trader in 1993 to the atelier today.",
    Icon: LegacyIcon,
  },
  {
    key: "purity",
    label: "Purity",
    body: "Natural diamonds only, never laboratory-grown. 18-karat gold throughout, never plated.",
    Icon: PurityIcon,
  },
  {
    key: "fair-weight",
    label: "Fair Weight",
    body: "Metal and stones weighed in front of you and priced to that weight. No rounding in our favour.",
    Icon: FairWeightIcon,
  },
  {
    key: "quality-check",
    label: "Quality Check",
    body: "Inspected at every stage — after setting, after polishing, and again before it is boxed.",
    Icon: QualityIcon,
  },
  {
    key: "certified",
    label: "Certified",
    body: "A house certificate with every piece, listing each natural stone's weight, colour, clarity and origin.",
    Icon: CertifiedIcon,
  },
  {
    key: "trust",
    label: "Customer Trust",
    body: "Resizing, re-polishing and re-rhodium plating for the life of the piece, at cost.",
    Icon: TrustIcon,
  },
  {
    key: "monogram",
    label: "The Monogram",
    body: "Every piece carries the house mark, so what you own can always be traced back to us.",
    Icon: MonogramIcon,
  },
];
