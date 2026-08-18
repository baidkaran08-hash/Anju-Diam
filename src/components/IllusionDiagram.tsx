/**
 * Side-by-side of a solitaire against an illusion setting of the same stone
 * weight, showing why the house technique reads larger.
 *
 * This is the single most important thing to explain on the site — it is the
 * brand's commercial argument, and no amount of adjectives makes it as clear
 * as two circles at their true relative size.
 */
export default function IllusionDiagram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 220" className={className} role="img" aria-labelledby="illusion-title">
      <title id="illusion-title">
        A 0.30 carat solitaire beside a 0.30 carat illusion setting: the same weight of diamond,
        presenting roughly twice the face-up spread.
      </title>

      <defs>
        <linearGradient id="ill-stone" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#C8A46A" stopOpacity={0.25} />
        </linearGradient>
      </defs>

      <g color="#8C6E3C">
        {/* Solitaire */}
        <g transform="translate(105 96)">
          <circle r="30" fill="url(#ill-stone)" stroke="currentColor" strokeWidth={1.2} />
          <circle r="16" fill="none" stroke="currentColor" strokeWidth={0.6} opacity={0.55} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 16}
                y1={Math.sin(a) * 16}
                x2={Math.cos(a) * 30}
                y2={Math.sin(a) * 30}
                stroke="currentColor"
                strokeWidth={0.5}
                opacity={0.55}
              />
            );
          })}
        </g>

        {/* Illusion cluster inside its plate */}
        <g transform="translate(315 96)">
          <path
            d="M-56 -34 h112 a8 8 0 0 1 8 8 v52 a8 8 0 0 1 -8 8 h-112 a8 8 0 0 1 -8 -8 v-52 a8 8 0 0 1 8 -8 Z"
            fill="url(#ill-stone)"
            fillOpacity={0.35}
            stroke="currentColor"
            strokeWidth={1.2}
          />
          {[-34, 0, 34].map((dx) => (
            <g key={dx} transform={`translate(${dx} 0)`}>
              <circle r="17" fill="url(#ill-stone)" stroke="currentColor" strokeWidth={1} />
              <circle r="9" fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.55} />
            </g>
          ))}
        </g>

        {/* Spread measures */}
        <g opacity={0.75}>
          <line x1="75" y1="150" x2="135" y2="150" stroke="currentColor" strokeWidth={0.8} />
          <line x1="75" y1="145" x2="75" y2="155" stroke="currentColor" strokeWidth={0.8} />
          <line x1="135" y1="145" x2="135" y2="155" stroke="currentColor" strokeWidth={0.8} />

          <line x1="251" y1="150" x2="379" y2="150" stroke="currentColor" strokeWidth={0.8} />
          <line x1="251" y1="145" x2="251" y2="155" stroke="currentColor" strokeWidth={0.8} />
          <line x1="379" y1="145" x2="379" y2="155" stroke="currentColor" strokeWidth={0.8} />
        </g>

        <text x="105" y="180" textAnchor="middle" fill="currentColor" fontSize="10" letterSpacing="2.6">
          SOLITAIRE
        </text>
        <text x="105" y="198" textAnchor="middle" fill="currentColor" fontSize="9" opacity={0.6} letterSpacing="1.4">
          0.30 ct · 4.3 mm
        </text>

        <text x="315" y="180" textAnchor="middle" fill="currentColor" fontSize="10" letterSpacing="2.6">
          ILLUSION SET
        </text>
        <text x="315" y="198" textAnchor="middle" fill="currentColor" fontSize="9" opacity={0.6} letterSpacing="1.4">
          0.30 ct · 9.1 mm face-up
        </text>
      </g>
    </svg>
  );
}
