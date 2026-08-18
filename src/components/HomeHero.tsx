"use client";

import Link from "next/link";

import FrameSequence, { type Chapter } from "@/components/FrameSequence";
import { DiamondRule } from "@/components/Logo";

/**
 * The opening film.
 *
 * Five chapters keyed to points in the push-in. The dwell remap inside
 * FrameSequence slows the camera at each centre, so the copy has room to be
 * read without the visitor having to stop scrolling.
 *
 * The footage is lit against a warm champagne backdrop, so unlike the previous
 * cut this hero is *light*: the copy is wine, and it sits on the right, where
 * the model leaves the backdrop clean through the whole take.
 *
 * Nothing is laid over the film. An earlier version washed the frame with an
 * ivory gradient to buy contrast, which dulled exactly the warm colour that
 * makes the shot. The legibility now comes from `on-film`, a soft ivory halo
 * on the glyphs themselves — see globals.css.
 */

const CHAPTERS: Chapter[] = [
  {
    center: 0.04,
    label: "Bangkok · 1993",
    heading: "Everyday Luxury.\nTimeless Brilliance.",
    body: "Fine natural diamond jewellery, handcrafted since 1993.",
  },
  {
    center: 0.3,
    label: "The House Standard",
    heading: "Natural stones.\nNothing below VS.",
    body: "Every piece is set in 18-karat gold with natural diamonds of G colour or higher and VS clarity or above. Never laboratory-grown, and no second tier.",
  },
  {
    center: 0.56,
    label: "The Speciality",
    heading: "The illusion\nsetting.",
    body: "A mirror-finished plate, cut by hand, that carries the spread of a far larger solitaire. It is the work this house has been known for since the beginning.",
  },
  {
    center: 0.8,
    label: "Made For You",
    heading: "Adjusted to\nyour hand.",
    body: "Sizing, metal, silhouette, stone. Every piece leaves the atelier made to one person's specification.",
  },
  {
    center: 0.97,
    label: "The Collections",
    heading: "Begin here.",
    body: "Rings, earrings, necklaces, bracelets and gifting.",
  },
];

export default function HomeHero({ poster, frameCount }: { poster?: string; frameCount: number }) {
  return (
    <FrameSequence frameCount={frameCount} chapters={CHAPTERS} poster={poster} scrollHeightVh={720}>
      {({ progress, index, chapter }) => (
        <>
          {/* Copy column. Keyed on the chapter so React remounts it and the
              entry animation replays on every change. */}
          <div className="pointer-events-none absolute inset-0 z-40 flex items-end pb-24 md:items-center md:pb-0">
            <div className="shell flex w-full md:justify-end">
              <div key={index} className="max-w-2xl md:max-w-[36rem] md:text-right">
                <p className="label on-film drift-in mb-6 text-wine" style={{ animationDelay: "40ms" }}>
                  {chapter.label}
                </p>

                <h1
                  className="display-hero on-film drift-in whitespace-pre-line text-wine"
                  style={{ animationDelay: "120ms" }}
                >
                  {chapter.heading}
                </h1>

                <p
                  className="drift-in on-film mt-7 max-w-[25ch] text-base font-normal leading-relaxed text-wine md:ml-auto"
                  style={{ animationDelay: "220ms" }}
                >
                  {chapter.body}
                </p>

                {index === CHAPTERS.length - 1 && (
                  <div
                    className="drift-in pointer-events-auto mt-10 flex flex-wrap gap-4 md:justify-end"
                    style={{ animationDelay: "320ms" }}
                  >
                    <Link href="/collections" className="btn-gold">
                      View the collections
                    </Link>
                    <Link href="/custom" className="btn-outline on-film text-wine">
                      Commission a piece
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chapter rail, held in a glass capsule so it reads as a control
              floating over the film rather than marks burned into it. */}
          <div className="glass-light glass-r pointer-events-none absolute left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 px-5 py-6 opacity-80 lg:flex xl:left-10">
            {CHAPTERS.map((item, i) => (
              <div key={item.label} className="flex items-center gap-3">
                <span
                  className={`block h-px transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    i === index ? "w-10 bg-wine" : "w-4 bg-wine/30"
                  }`}
                />
                <span
                  className={`label-sm whitespace-nowrap transition-all duration-700 ${
                    i === index ? "text-wine opacity-100" : "text-wine/60 opacity-70"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress hairline */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-px bg-wine/15">
            <div
              className="h-full origin-left bg-wine"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          {/* Scroll invitation, fading out as soon as the visitor moves. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-8 z-40 flex justify-center transition-opacity duration-700"
            style={{ opacity: progress < 0.03 ? 1 : 0 }}
          >
            <span className="glass-light flex items-center gap-3 rounded-full px-5 py-2.5 opacity-85">
              <DiamondRule className="h-3 w-16 text-wine/80" />
              <span className="label-sm text-wine/80">Scroll</span>
            </span>
          </div>
        </>
      )}
    </FrameSequence>
  );
}
