/**
 * Generated product artwork.
 *
 * The client's photography is not available yet, so every piece is drawn as a
 * plate illustration derived from its own record: the form is read out of the
 * slug (a "tennis-bracelet" is drawn as a line, a "bangle" as a hoop), the
 * stone shape picks the silhouette, the metal picks the line colour, and the
 * diamond count decides how many stones a line setting carries.
 *
 * This is deliberately an engraving rather than an attempt at a photograph. A
 * plate-style illustration reads as a house signature; a mediocre render of a
 * diamond reads as a placeholder. It also costs nothing to serve — no image
 * files, sharp at any size, and it themes with the brand automatically.
 *
 * The moment `product.images` has rows, ProductMedia renders the real
 * photograph instead and none of this is used.
 */

import { metalTone, type Metal, type StoneShape } from "@/lib/enums";

export type ArtProduct = {
  slug: string;
  category: string;
  metal: string;
  stoneShape: string;
  diamondCount: number;
  illusionSet: boolean;
  diamondColour?: string;
  diamondClarity?: string;
};

/** FNV-1a. Stable across runs, unlike anything seeded from Math.random. */
function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

// ── Form detection ──────────────────────────────────────────────────────────
//
// The slug carries the form the piece actually is — "aurelia-tennis-bracelet",
// "iris-illusion-studs". Reading it means the drawing matches the product
// rather than being a generic stand-in for its category.

type Composition =
  | "ring-head"
  | "ring-band"
  | "stud"
  | "drop"
  | "hoop"
  | "pendant"
  | "collar"
  | "line"
  | "bangle";

function compositionFor(slug: string, category: string): Composition {
  const s = slug.toLowerCase();

  if (/hoop/.test(s)) return "hoop";
  if (/climber|drop/.test(s)) return "drop";
  if (/stud/.test(s)) return "stud";

  if (/tennis-bracelet|line-bracelet|charm/.test(s)) return "line";
  if (/bangle|cuff/.test(s)) return "bangle";

  if (/riviere|tennis-necklace|station/.test(s)) return "collar";
  if (/pendant/.test(s)) return "pendant";

  if (/eternity|wedding-band|anniversary|stacking/.test(s)) return "ring-band";
  if (/ring/.test(s)) return "ring-head";

  switch (category) {
    case "EARRINGS":
      return "stud";
    case "NECKLACES":
      return "pendant";
    case "BRACELETS":
      return "line";
    default:
      return "ring-head";
  }
}

/** Solitaire, three-stone or a full cluster head. */
function headStones(slug: string) {
  if (/three-stone/.test(slug)) return 3;
  if (/cluster|halo/.test(slug)) return 7;
  return 1;
}

// ── Stone silhouettes ───────────────────────────────────────────────────────
//
// Each returns paths centred on (0,0), sized so the stone's largest dimension
// is `s`. Facet lines are what sell it — a bare outline is a shape, an outline
// with a table and crown facets is a cut stone.

function stoneGeometry(shape: StoneShape, s: number) {
  const outline: string[] = [];
  const facets: string[] = [];

  switch (shape) {
    case "ROUND": {
      const r = s / 2;
      const t = r * 0.54;
      outline.push(circlePath(r));
      facets.push(circlePath(t));
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        facets.push(line(Math.cos(a) * t, Math.sin(a) * t, Math.cos(a) * r, Math.sin(a) * r));
      }
      break;
    }

    case "OVAL": {
      const rx = s * 0.36;
      const ry = s / 2;
      outline.push(ellipsePath(rx, ry));
      facets.push(ellipsePath(rx * 0.54, ry * 0.54));
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        facets.push(
          line(Math.cos(a) * rx * 0.54, Math.sin(a) * ry * 0.54, Math.cos(a) * rx, Math.sin(a) * ry),
        );
      }
      break;
    }

    case "PEAR": {
      const rx = s * 0.34;
      const ry = s / 2;
      outline.push(
        `M 0 ${-ry} C ${rx * 0.86} ${-ry * 0.42} ${rx} ${ry * 0.18} ${rx} ${ry * 0.38} C ${rx} ${ry * 0.82} ${rx * 0.55} ${ry} 0 ${ry} C ${-rx * 0.55} ${ry} ${-rx} ${ry * 0.82} ${-rx} ${ry * 0.38} C ${-rx} ${ry * 0.18} ${-rx * 0.86} ${-ry * 0.42} 0 ${-ry} Z`,
      );
      facets.push(ellipsePath(rx * 0.5, ry * 0.4, 0, ry * 0.16));
      facets.push(line(0, -ry, 0, ry));
      facets.push(line(-rx * 0.94, ry * 0.34, rx * 0.94, ry * 0.34));
      break;
    }

    case "MARQUISE": {
      const rx = s * 0.28;
      const ry = s / 2;
      outline.push(
        `M 0 ${-ry} C ${rx} ${-ry * 0.42} ${rx} ${ry * 0.42} 0 ${ry} C ${-rx} ${ry * 0.42} ${-rx} ${-ry * 0.42} 0 ${-ry} Z`,
      );
      facets.push(
        `M 0 ${-ry * 0.52} C ${rx * 0.62} ${-ry * 0.2} ${rx * 0.62} ${ry * 0.2} 0 ${ry * 0.52} C ${-rx * 0.62} ${ry * 0.2} ${-rx * 0.62} ${-ry * 0.2} 0 ${-ry * 0.52} Z`,
      );
      facets.push(line(0, -ry, 0, ry));
      break;
    }

    case "EMERALD": {
      const w = s * 0.38;
      const h = s / 2;
      const c = s * 0.11;
      outline.push(octagonPath(w, h, c));
      facets.push(octagonPath(w * 0.74, h * 0.78, c * 0.72));
      facets.push(octagonPath(w * 0.46, h * 0.52, c * 0.46));
      break;
    }

    case "PRINCESS": {
      const a = s * 0.42;
      outline.push(`M ${-a} ${-a} L ${a} ${-a} L ${a} ${a} L ${-a} ${a} Z`);
      facets.push(line(-a, -a, a, a));
      facets.push(line(a, -a, -a, a));
      facets.push(`M ${-a * 0.5} ${-a * 0.5} L ${a * 0.5} ${-a * 0.5} L ${a * 0.5} ${a * 0.5} L ${-a * 0.5} ${a * 0.5} Z`);
      break;
    }

    case "CUSHION": {
      const a = s * 0.44;
      const r = a * 0.42;
      outline.push(roundedSquarePath(a, r));
      facets.push(roundedSquarePath(a * 0.56, r * 0.56));
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        facets.push(line(x * a * 0.42, y * a * 0.42, x * a * 0.78, y * a * 0.78));
      }
      break;
    }
  }

  return { outline, facets };
}

const n = (value: number) => value.toFixed(2);
const line = (x1: number, y1: number, x2: number, y2: number) =>
  `M ${n(x1)} ${n(y1)} L ${n(x2)} ${n(y2)}`;

function circlePath(r: number) {
  return `M ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 Z`;
}

function ellipsePath(rx: number, ry: number, cx = 0, cy = 0) {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
}

function octagonPath(w: number, h: number, c: number) {
  return `M ${-w + c} ${-h} L ${w - c} ${-h} L ${w} ${-h + c} L ${w} ${h - c} L ${w - c} ${h} L ${-w + c} ${h} L ${-w} ${h - c} L ${-w} ${-h + c} Z`;
}

function roundedSquarePath(a: number, r: number) {
  return `M ${-a + r} ${-a} L ${a - r} ${-a} Q ${a} ${-a} ${a} ${-a + r} L ${a} ${a - r} Q ${a} ${a} ${a - r} ${a} L ${-a + r} ${a} Q ${-a} ${a} ${-a} ${a - r} L ${-a} ${-a + r} Q ${-a} ${-a} ${-a + r} ${-a} Z`;
}

// ── Primitives ──────────────────────────────────────────────────────────────

type StoneProps = {
  shape: StoneShape;
  size: number;
  x?: number;
  y?: number;
  rotate?: number;
  filled?: boolean;
  gradientId: string;
};

function Stone({ shape, size, x = 0, y = 0, rotate = 0, filled = true, gradientId }: StoneProps) {
  const { outline, facets } = stoneGeometry(shape, size);
  return (
    <g transform={`translate(${n(x)} ${n(y)}) rotate(${n(rotate)})`}>
      {outline.map((d, i) => (
        <path key={`o${i}`} d={d} fill={filled ? `url(#${gradientId})` : "none"} stroke="currentColor" strokeWidth={1.1} />
      ))}
      {facets.map((d, i) => (
        <path key={`f${i}`} d={d} fill="none" stroke="currentColor" strokeWidth={0.55} opacity={0.5} />
      ))}
    </g>
  );
}

/** Four claws gripping a stone of the given size. */
function Claws({ x, y, size, r = 4 }: { x: number; y: number; size: number; r?: number }) {
  const d = size * 0.33;
  return (
    <>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sy) => (
          <circle key={`${sx}${sy}`} cx={x + sx * d} cy={y + sy * d} r={r} fill="currentColor" opacity={0.9} />
        )),
      )}
    </>
  );
}

/** The faceted plate that makes an illusion setting read as one larger stone. */
function IllusionPlate({ x, y, size, shape }: { x: number; y: number; size: number; shape: StoneShape }) {
  const { outline } = stoneGeometry(shape === "ROUND" ? "CUSHION" : shape, size);
  return (
    <g transform={`translate(${n(x)} ${n(y)})`}>
      {outline.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={0.8} opacity={0.4} strokeDasharray="4 4" />
      ))}
    </g>
  );
}

/** Points along the top half of a circle, left to right. */
function topArc(cx: number, cy: number, r: number, count: number, spread = Math.PI) {
  const start = -Math.PI / 2 - spread / 2;
  return Array.from({ length: count }, (_, i) => {
    const a = start + (spread * i) / Math.max(1, count - 1);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a };
  });
}

// ── Compositions ────────────────────────────────────────────────────────────

const VB_W = 400;
const VB_H = 500;

type Ctx = {
  shape: StoneShape;
  illusion: boolean;
  gradientId: string;
  seed: number;
  slug: string;
  count: number;
};

/** Classic solitaire / three-stone / cluster head sitting on a shank. */
function RingHead({ shape, illusion, gradientId, slug, seed }: Ctx) {
  const cx = VB_W / 2;
  const cy = 328;
  const r = 84;
  const stones = headStones(slug);
  const main = illusion ? 96 : stones === 1 ? 92 : 78;
  const headY = cy - r - main * 0.42;

  return (
    <g>
      {/* Shank */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={9} opacity={0.92} />
      <circle cx={cx} cy={cy} r={r - 4.5} fill="none" stroke="currentColor" strokeWidth={0.7} opacity={0.3} />
      <circle cx={cx} cy={cy} r={r + 4.5} fill="none" stroke="currentColor" strokeWidth={0.7} opacity={0.3} />

      {/* Gallery: the pierced structure carrying the head off the shank. */}
      <path
        d={`M ${cx - 24} ${cy - r + 2} L ${cx - 17} ${headY + main * 0.3} M ${cx + 24} ${cy - r + 2} L ${cx + 17} ${headY + main * 0.3}`}
        stroke="currentColor"
        strokeWidth={2.6}
        fill="none"
        opacity={0.85}
      />

      {stones === 3 && (
        <>
          <Stone shape={shape} size={main * 0.62} x={cx - main * 0.72} y={headY + main * 0.06} gradientId={gradientId} />
          <Stone shape={shape} size={main * 0.62} x={cx + main * 0.72} y={headY + main * 0.06} gradientId={gradientId} />
        </>
      )}

      {stones === 7 &&
        Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <Stone
              key={i}
              shape={shape}
              size={main * 0.42}
              x={cx + Math.cos(a) * main * 0.66}
              y={headY + Math.sin(a) * main * 0.66}
              gradientId={gradientId}
            />
          );
        })}

      {illusion && <IllusionPlate x={cx} y={headY} size={main * 1.5} shape={shape} />}
      <Stone shape={shape} size={main} x={cx} y={headY} rotate={seed * 2 - 1} gradientId={gradientId} />
      <Claws x={cx} y={headY} size={main} />
    </g>
  );
}

/** Eternity, wedding and anniversary bands — stones set into the band itself. */
function RingBand({ shape, gradientId, slug, count }: Ctx) {
  const cx = VB_W / 2;
  const cy = 262;
  const r = 118;
  // A full eternity has to read as continuous, so it always carries a dense
  // run regardless of the record's stone count. A sparse ring of five stones
  // around a full circle looks like a mistake, not a design.
  const half = /half|wedding|anniversary|stacking/.test(slug);
  const spread = half ? Math.PI * 0.66 : Math.PI * 1.98;
  const stoneCount = half ? Math.min(9, Math.max(5, Math.round(count / 2))) : 20;

  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 15} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.32} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={30} opacity={0.22} />
      <circle cx={cx} cy={cy} r={r - 15} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.32} />

      {topArc(cx, cy, r, stoneCount, spread).map((p, i) => (
        <Stone key={i} shape={shape} size={25} x={p.x} y={p.y} gradientId={gradientId} />
      ))}
    </g>
  );
}

function Studs({ shape, illusion, gradientId }: Ctx) {
  const y = 250;
  const size = illusion ? 104 : 96;
  return (
    <g>
      {[-1, 1].map((side) => {
        const x = VB_W / 2 + side * 88;
        return (
          <g key={side}>
            {/* Post, seen edge-on behind the stone. */}
            <path d={line(x, y, x, y + size * 0.86)} stroke="currentColor" strokeWidth={2} opacity={0.4} />
            <circle cx={x} cy={y + size * 0.86} r={5} fill="none" stroke="currentColor" strokeWidth={1.6} opacity={0.4} />
            {illusion && <IllusionPlate x={x} y={y} size={size * 1.46} shape={shape} />}
            <Stone shape={shape} size={size} x={x} y={y} gradientId={gradientId} />
            <Claws x={x} y={y} size={size} r={4.4} />
          </g>
        );
      })}
    </g>
  );
}

function Drops({ shape, illusion, gradientId }: Ctx) {
  const top = 122;
  return (
    <g>
      {[-1, 1].map((side) => {
        const x = VB_W / 2 + side * 88;
        const dropY = top + 168;
        return (
          <g key={side}>
            {/* Ear wire */}
            <path
              d={`M ${x - 16} ${top} A 16 20 0 1 1 ${x + 12} ${top + 12}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              opacity={0.8}
              strokeLinecap="round"
            />
            <Stone shape={shape} size={44} x={x} y={top + 44} gradientId={gradientId} />
            <path d={line(x, top + 66, x, dropY - 52)} stroke="currentColor" strokeWidth={1.6} opacity={0.6} />
            {illusion && <IllusionPlate x={x} y={dropY} size={132} shape={shape} />}
            <Stone shape={shape} size={92} x={x} y={dropY} gradientId={gradientId} />
            <Claws x={x} y={dropY} size={92} r={4} />
          </g>
        );
      })}
    </g>
  );
}

function Hoops({ shape, gradientId }: Ctx) {
  const cy = 250;
  return (
    <g>
      {[-1, 1].map((side) => {
        const cx = VB_W / 2 + side * 92;
        const r = 74;
        return (
          <g key={side}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={7} opacity={0.9} />
            <circle cx={cx} cy={cy} r={r - 3.5} fill="none" stroke="currentColor" strokeWidth={0.6} opacity={0.3} />
            {topArc(cx, cy, r, 9, Math.PI * 1.1).map((p, i) => (
              <Stone key={i} shape={shape} size={20} x={p.x} y={p.y} gradientId={gradientId} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function Pendant({ shape, illusion, gradientId }: Ctx) {
  const cx = VB_W / 2;
  const chainY = 128;
  const sag = 128;
  const bottom = chainY + sag * 0.5;
  const size = 112;

  return (
    <g>
      <path
        d={`M 54 ${chainY} Q ${cx} ${chainY + sag} ${VB_W - 54} ${chainY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        opacity={0.75}
      />
      {/* Bail */}
      <ellipse cx={cx} cy={bottom + 22} rx={10} ry={15} fill="none" stroke="currentColor" strokeWidth={2.4} opacity={0.85} />
      {illusion && <IllusionPlate x={cx} y={bottom + 40 + size * 0.5} size={size * 1.44} shape={shape} />}
      <Stone shape={shape} size={size} x={cx} y={bottom + 40 + size * 0.5} gradientId={gradientId} />
      <Claws x={cx} y={bottom + 40 + size * 0.5} size={size} r={4.2} />
    </g>
  );
}

/** Riviere, tennis necklace, station necklace — a graduated run along a curve. */
function Collar({ shape, gradientId, slug }: Ctx) {
  const chainY = 170;
  const sag = 150;
  const station = /station/.test(slug);
  const count = station ? 9 : 17;

  return (
    <g>
      <path
        d={`M 52 ${chainY} Q ${VB_W / 2} ${chainY + sag} ${VB_W - 52} ${chainY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={station ? 2 : 1.4}
        opacity={station ? 0.7 : 0.3}
      />
      {Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1);
        const x = 52 + (VB_W - 104) * t;
        const y = (1 - t) * (1 - t) * chainY + 2 * (1 - t) * t * (chainY + sag) + t * t * chainY;
        // Graduated: largest at the centre, tapering to the clasp.
        const scale = station ? 1 : 0.45 + 0.55 * Math.sin(Math.PI * t);
        return <Stone key={i} shape={shape} size={(station ? 26 : 34) * scale + 10} x={x} y={y} gradientId={gradientId} />;
      })}
    </g>
  );
}

/** Tennis and line bracelets — a shallow arc, as the piece lies on a surface. */
function LineBracelet({ shape, gradientId }: Ctx) {
  const cy = 250;
  const count = 15;
  const left = 52;
  const right = VB_W - 52;
  const lift = 54;

  // Sags in the middle, the way a bracelet lies when it is laid down flat.
  // An upward arc reads as a tiara.
  const at = (t: number) => ({
    x: left + (right - left) * t,
    y: cy + lift - 4 * lift * (t - 0.5) * (t - 0.5),
  });

  const start = at(0);
  const mid = at(0.5);
  const end = at(1);

  return (
    <g>
      <path
        d={`M ${n(start.x)} ${n(start.y)} Q ${n(mid.x)} ${n(mid.y + lift)} ${n(end.x)} ${n(end.y)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        opacity={0.28}
      />
      {Array.from({ length: count }, (_, i) => {
        const p = at(i / (count - 1));
        return <Stone key={i} shape={shape} size={34} x={p.x} y={p.y} gradientId={gradientId} />;
      })}
      {/* Concealed box clasp with its double catch. */}
      <g opacity={0.7}>
        <rect x={VB_W / 2 - 16} y={cy + 96} width={32} height={26} rx={3} fill="none" stroke="currentColor" strokeWidth={2} />
        <path d={line(VB_W / 2 - 6, cy + 109, VB_W / 2 + 6, cy + 109)} stroke="currentColor" strokeWidth={1.4} />
      </g>
    </g>
  );
}

function Bangle({ shape, gradientId, slug }: Ctx) {
  const cx = VB_W / 2;
  const cy = 258;
  const r = 128;
  const cuff = /cuff/.test(slug);

  return (
    <g>
      {cuff ? (
        // A C, opening at the bottom — drawn as a dashed circle with a single
        // gap rather than an arc, so the terminals stay perfectly on the round.
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={11}
          opacity={0.92}
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * r * 0.82} ${2 * Math.PI * r * 0.18}`}
          transform={`rotate(99 ${cx} ${cy})`}
        />
      ) : (
        <>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={11} opacity={0.92} />
          <circle cx={cx} cy={cy} r={r - 5.5} fill="none" stroke="currentColor" strokeWidth={0.7} opacity={0.3} />
          <circle cx={cx} cy={cy} r={r + 5.5} fill="none" stroke="currentColor" strokeWidth={0.7} opacity={0.3} />
        </>
      )}
      {topArc(cx, cy, r, 7, Math.PI * 0.78).map((p, i) => (
        <Stone key={i} shape={shape} size={i === 3 ? 44 : 28} x={p.x} y={p.y} gradientId={gradientId} />
      ))}
    </g>
  );
}

// ── Public component ────────────────────────────────────────────────────────

export type ArtTone = "plum" | "ivory" | "ink";

const TONES: Record<ArtTone, { bg: string; glow: string }> = {
  plum: { bg: "#4F243C", glow: "#6B3A56" },
  ivory: { bg: "#F2EDE6", glow: "#FFFFFF" },
  ink: { bg: "#140A10", glow: "#3A1E30" },
};

export function ProductArt({
  product,
  tone = "plum",
  className,
  title,
}: {
  product: ArtProduct;
  tone?: ArtTone;
  className?: string;
  title?: string;
}) {
  const seed = hash(product.slug);
  const shape = (product.stoneShape as StoneShape) ?? "ROUND";
  const metal = (product.metal as Metal) ?? "YELLOW_GOLD_18K";

  const palette = TONES[tone];
  const metalHue = metalTone[metal] ?? metalTone.YELLOW_GOLD_18K;
  // On a light ground the alloy's dark tone carries the line; on a dark ground
  // its light tone does. Either way the line reads as the actual metal.
  const stroke = tone === "ivory" ? metalHue.dark : metalHue.light;

  const uid = `a${Math.round(seed * 1e9).toString(36)}`;
  const gradientId = `${uid}s`;

  const ctx: Ctx = {
    shape,
    illusion: product.illusionSet,
    gradientId,
    seed,
    slug: product.slug.toLowerCase(),
    count: product.diamondCount,
  };

  const composition = compositionFor(ctx.slug, product.category);
  const draw = {
    "ring-head": RingHead,
    "ring-band": RingBand,
    stud: Studs,
    drop: Drops,
    hoop: Hoops,
    pendant: Pendant,
    collar: Collar,
    line: LineBracelet,
    bangle: Bangle,
  }[composition];

  const caption = product.illusionSet
    ? "ILLUSION SET"
    : `18K · ${product.diamondColour ?? "G"} · ${product.diamondClarity ?? "VS"}`;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={className}
      role="img"
      aria-label={title ? `Illustration of the ${title}` : "Illustration of the piece"}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={`${uid}g`} cx="50%" cy="36%" r="74%">
          <stop offset="0%" stopColor={palette.glow} stopOpacity={tone === "ivory" ? 1 : 0.8} />
          <stop offset="100%" stopColor={palette.bg} />
        </radialGradient>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={tone === "ivory" ? 0.92 : 0.3} />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity={tone === "ivory" ? 0.5 : 0.1} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0.2} />
        </linearGradient>
      </defs>

      <rect width={VB_W} height={VB_H} fill={`url(#${uid}g)`} />

      {/* Plate border. */}
      <rect x={18} y={18} width={VB_W - 36} height={VB_H - 36} fill="none" stroke={stroke} strokeWidth={0.7} opacity={0.2} />

      <g color={stroke}>{draw(ctx)}</g>

      <text
        x={VB_W / 2}
        y={VB_H - 42}
        textAnchor="middle"
        fill={stroke}
        opacity={0.55}
        fontSize={10}
        letterSpacing={3.6}
        fontFamily="var(--font-body), system-ui, sans-serif"
      >
        {caption}
      </text>
    </svg>
  );
}
