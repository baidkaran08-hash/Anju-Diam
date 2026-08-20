"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { LotusMark } from "@/components/Logo";

/**
 * Scroll-driven frame sequence.
 *
 * Scroll position drives a canvas playing pre-rendered WebP frames of a slow
 * push-in on the model, lit against a warm champagne studio backdrop.
 *
 * Three things make it feel expensive rather than janky:
 *
 * 1. Dwell remapping. Raw scroll progress is passed through a lookup table
 *    built from Gaussians centred on each chapter, so the camera slows where
 *    there is something to read and runs on between. The viewer feels pacing,
 *    not resistance.
 *
 * 2. LERP smoothing. The drawn frame chases the target instead of snapping to
 *    it, which hides the stepping on a fast flick scroll.
 *
 * 3. Two-wave loading. Chapter anchor frames load first so the hero is usable
 *    in well under a second, then the rest fills in behind. A nearest-loaded
 *    fallback means the canvas never flashes blank while a wave is in flight.
 */

export type Chapter = {
  /** Where this chapter sits in remapped progress, 0–1. */
  center: number;
  label: string;
  heading: string;
  body: string;
};

type Props = {
  frameCount: number;
  chapters: Chapter[];
  /** Rendered inside the pinned stage — chapter copy, rails, telemetry. */
  children: (state: { progress: number; index: number; chapter: Chapter }) => React.ReactNode;
  poster?: string;
  scrollHeightVh?: number;
};

/**
 * Which frame set to pull.
 *
 * Keyed on the canvas the device will actually build, not on a guess. A
 * 1440pt Retina laptop makes a 2880x1800 canvas and — because the frame is
 * wider than the viewport — draws the frame ~3355px wide, so anything below
 * the ultra set is upscaled on every draw.
 */
function pickTier() {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  if (width <= 780) return "mobile";
  if (dpr >= 1.6 && width >= 1100) return "ultra";
  return "desktop";
}

const LERP_FACTOR = 0.115;
const DWELL_WIDTH = 0.042;
const DWELL_PEAK = 2.6;
const LUT_SIZE = 2400;

export default function FrameSequence({
  frameCount,
  chapters,
  children,
  poster,
  scrollHeightVh = 700,
}: Props) {
  const sequenceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [state, setState] = useState({ progress: 0, index: 0 });

  // Chapters arrive as a literal from the parent, so a fresh array identity on
  // every render would tear down and rebuild the whole sequence. Key the effect
  // on the centres instead.
  const centreKey = chapters.map((chapter) => chapter.center).join(",");
  const centres = useMemo(
    () => centreKey.split(",").map(Number),
    [centreKey],
  );

  useEffect(() => {
    const sequence = sequenceRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!sequence || !stage || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    // The frames are drawn into a high-DPI canvas, so resampling quality is the
    // single biggest lever on how sharp this looks.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileMedia = window.matchMedia("(max-width: 780px)");

    let tier = pickTier();
    let currentFrame = 0;
    let lastDrawn = -1;
    let pageVisible = true;
    let rafId = 0;
    let sequenceTop = 0;
    let sequenceDistance = 1;
    let cancelled = false;

    const images = new Array<HTMLImageElement | null>(frameCount);
    const loaded = new Uint8Array(frameCount);
    const promises = new Array<Promise<HTMLImageElement | null> | null>(frameCount);

    const frameUrl = (index: number) =>
      `/frames/${tier}/frame-${String(index + 1).padStart(4, "0")}.webp`;

    function loadFrame(index: number): Promise<HTMLImageElement | null> {
      if (loaded[index]) return Promise.resolve(images[index]);
      if (promises[index]) return promises[index]!;

      promises[index] = new Promise((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          images[index] = image;
          loaded[index] = 1;
          resolve(image);
        };
        image.onerror = () => {
          promises[index] = null;
          resolve(null);
        };
        image.src = frameUrl(index);
      });
      return promises[index]!;
    }

    async function loadInBatches(indices: number[], size = 10) {
      for (let start = 0; start < indices.length; start += size) {
        if (cancelled) return;
        await Promise.all(indices.slice(start, start + size).map(loadFrame));
      }
    }

    function nearestLoaded(index: number) {
      if (loaded[index]) return index;
      for (let distance = 1; distance < frameCount; distance += 1) {
        if (index - distance >= 0 && loaded[index - distance]) return index - distance;
        if (index + distance < frameCount && loaded[index + distance]) return index + distance;
      }
      return -1;
    }

    function resizeCanvas() {
      // Full device pixel ratio, capped at 2 only to keep 3x phones sane.
      // An earlier revision capped this at 1.75 to save fill rate; on a Retina
      // screen that is plainly visible as blur and was the single biggest
      // reason the sequence looked soft. The ultra frame set is sized so the
      // source still exceeds the canvas at DPR 2.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(stage!.clientWidth * dpr);
      const height = Math.round(stage!.clientHeight * dpr);
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
        lastDrawn = -1;
        // Resizing a canvas resets context state, smoothing included.
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = "high";
      }
    }

    function updateMetrics() {
      const rect = sequence!.getBoundingClientRect();
      sequenceTop = window.scrollY + rect.top;
      sequenceDistance = Math.max(1, rect.height - window.innerHeight);
    }

    function drawFrame(index: number) {
      const resolved = nearestLoaded(Math.max(0, Math.min(frameCount - 1, index)));
      if (resolved < 0 || resolved === lastDrawn) return;
      const image = images[resolved];
      if (!image?.naturalWidth) return;

      const { width, height } = canvas!;
      // The backdrop's own average tone, so any letterboxing on an extreme
      // aspect ratio blends into the shot instead of framing it in black.
      ctx!.fillStyle = "#A48769";
      ctx!.fillRect(0, 0, width, height);

      // On mobile the frame is pulled up and shown smaller so the chapter copy
      // has clean backdrop to sit on. Without this the copy lands on the
      // model's burgundy dress, where wine type is unreadable — and the fix
      // cannot be a scrim, because that would wash out the film.
      const coverScale =
        tier === "mobile"
          ? Math.max(width / image.naturalWidth, (height * 0.56) / image.naturalHeight)
          : Math.max(width / image.naturalWidth, height / image.naturalHeight);

      const drawWidth = image.naturalWidth * coverScale;
      const drawHeight = image.naturalHeight * coverScale;
      const x = (width - drawWidth) / 2;
      const y = tier === "mobile" ? height * 0.3 - drawHeight / 2 : (height - drawHeight) / 2;

      ctx!.drawImage(image, x, y, drawWidth, drawHeight);
      lastDrawn = resolved;
    }

    // ── Dwell remap lookup table ──────────────────────────────────────────
    const rawAtEffective = new Float64Array(LUT_SIZE + 1);

    (function buildLut() {
      const density = new Float64Array(LUT_SIZE + 1);
      let total = 0;
      for (let i = 0; i <= LUT_SIZE; i += 1) {
        const effective = i / LUT_SIZE;
        let value = 1;
        for (const centre of centres) {
          const delta = (effective - centre) / DWELL_WIDTH;
          value += DWELL_PEAK * Math.exp(-0.5 * delta * delta);
        }
        density[i] = value;
        if (i > 0) total += (density[i - 1] + value) * 0.5;
        rawAtEffective[i] = total;
      }
      for (let i = 0; i <= LUT_SIZE; i += 1) rawAtEffective[i] /= total;
    })();

    function remapProgress(raw: number) {
      let low = 0;
      let high = LUT_SIZE;
      while (low < high) {
        const mid = (low + high) >> 1;
        if (rawAtEffective[mid]! < raw) low = mid + 1;
        else high = mid;
      }
      const index = Math.max(1, low);
      const left = rawAtEffective[index - 1]!;
      const span = rawAtEffective[index]! - left || 1;
      return Math.max(0, Math.min(1, (index - 1 + (raw - left) / span) / LUT_SIZE));
    }

    function tick() {
      if (!pageVisible || reducedMotion || cancelled) return;

      const raw = Math.max(0, Math.min(1, (window.scrollY - sequenceTop) / sequenceDistance));
      const effective = remapProgress(raw);

      const target = Math.round(effective * (frameCount - 1));
      currentFrame += (target - currentFrame) * LERP_FACTOR;
      drawFrame(Math.round(currentFrame));

      // Chapter state runs off un-smoothed progress, so copy is never late
      // relative to the frame actually on screen.
      let nearestIndex = 0;
      let nearest = Infinity;
      centres.forEach((centre, index) => {
        const distance = Math.abs(effective - centre);
        if (distance < nearest) {
          nearest = distance;
          nearestIndex = index;
        }
      });

      // Re-rendering React on every animation frame is the fastest way to make
      // a site feel cheap, so only publish meaningful changes.
      setState((previous) =>
        previous.index === nearestIndex && Math.abs(previous.progress - raw) < 0.004
          ? previous
          : { progress: raw, index: nearestIndex },
      );

      rafId = requestAnimationFrame(tick);
    }

    async function init() {
      resizeCanvas();
      updateMetrics();

      if (reducedMotion) {
        const still = Math.round(0.18 * (frameCount - 1));
        await loadFrame(still);
        drawFrame(still);
        setLoadProgress(1);
        setReady(true);
        return;
      }

      const critical = Array.from(
        new Set([0, ...centres.map((c) => Math.round(c * (frameCount - 1))), frameCount - 1]),
      ).sort((a, b) => a - b);

      await loadFrame(0);
      drawFrame(0);
      setLoadProgress(0.3);

      let done = 0;
      const tail = critical.filter((index) => index !== 0);
      await Promise.all(
        tail.map(async (index) => {
          await loadFrame(index);
          done += 1;
          setLoadProgress(0.3 + 0.65 * (done / tail.length));
        }),
      );

      if (cancelled) return;
      drawFrame(nearestLoaded(0));
      setLoadProgress(1);
      setReady(true);
      tick();

      // The full sequence is ~19 MB. Holding it back until the visitor either
      // starts scrolling or the page has gone quiet keeps it from competing
      // with the fonts, the catalogue query and the LCP — and a visitor who
      // never scrolls past the hero never pays for it at all.
      const rest = Array.from({ length: frameCount }, (_, i) => i).filter(
        (i) => !critical.includes(i),
      );

      let bulkStarted = false;
      const startBulk = () => {
        if (bulkStarted || cancelled) return;
        bulkStarted = true;
        window.removeEventListener("scroll", startBulk);
        window.removeEventListener("pointerdown", startBulk);
        void loadInBatches(rest);
      };

      window.addEventListener("scroll", startBulk, { passive: true, once: true });
      window.addEventListener("pointerdown", startBulk, { passive: true, once: true });

      const idle = window.requestIdleCallback?.bind(window);
      if (idle) idle(startBulk, { timeout: 2500 });
      else setTimeout(startBulk, 1800);
    }

    const onResize = () => {
      resizeCanvas();
      updateMetrics();
    };
    // Re-evaluate the tier whenever the viewport crosses a breakpoint or the
    // window moves to a display with a different pixel ratio.
    const onTierChange = () => {
      const next = pickTier();
      if (next === tier) return;
      tier = next;
      lastDrawn = -1;
      loaded.fill(0);
      promises.fill(null);
      images.fill(null);
      onResize();
      void loadFrame(Math.round(currentFrame)).then(() => drawFrame(Math.round(currentFrame)));
    };
    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible && !reducedMotion) {
        cancelAnimationFrame(rafId);
        tick();
      }
    };

    const onWindowResize = () => {
      onResize();
      onTierChange();
    };

    window.addEventListener("resize", onWindowResize, { passive: true });
    mobileMedia.addEventListener("change", onTierChange);
    document.addEventListener("visibilitychange", onVisibility);

    void init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onWindowResize);
      mobileMedia.removeEventListener("change", onTierChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [frameCount, centres]);

  const chapter = chapters[state.index] ?? chapters[0]!;

  return (
    <section
      ref={sequenceRef}
      style={{ height: `${scrollHeightVh}vh` }}
      className="relative"
      aria-label="The house film"
    >
      <div ref={stageRef} className="grain sticky top-0 h-[100svh] w-full overflow-hidden bg-[#A48769]">
        {poster && (
          <div
            aria-hidden
            className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
            style={{ backgroundImage: `url(${poster})` }}
          />
        )}

        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full"
          role="img"
          aria-label="A woman wearing an Anju Diam natural diamond necklace, chandelier earrings, a ruby ring and a diamond bracelet against a warm champagne backdrop, as the camera moves slowly in."
        />

        {!ready && (
          <div
            className="absolute inset-0 z-50 grid place-content-center justify-items-center gap-8 bg-champagne"
            role="status"
            aria-live="polite"
          >
            <LotusMark tone="plum" className="h-16 w-auto" />
            <div className="h-px w-56 overflow-hidden bg-graphite/12">
              <div
                className="h-full origin-left bg-wine transition-transform duration-500"
                style={{ transform: `scaleX(${loadProgress})` }}
              />
            </div>
            <span className="label text-graphite/45">{Math.round(loadProgress * 100)}%</span>
          </div>
        )}

        {children({ progress: state.progress, index: state.index, chapter })}
      </div>
    </section>
  );
}
