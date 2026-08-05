"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-driven frame sequence.
 *
 * Scroll position drives a canvas playing 240 pre-rendered WebP frames of the
 * house solitaire turning through 360 degrees.
 *
 * Two things make it feel expensive rather than janky:
 *
 * 1. Dwell remapping. Raw scroll progress is passed through a lookup table
 *    built from Gaussians centred on each chapter, so the rotation slows where
 *    there is something to read and runs on between. The viewer feels pacing,
 *    not resistance.
 *
 * 2. LERP smoothing. The drawn frame chases the target frame instead of
 *    snapping to it, which hides the stepping on a fast flick scroll.
 *
 * Frames load in two waves — chapter anchors first so the page is usable in
 * under a second, then everything else in small batches. A nearest-loaded
 * fallback means the canvas never flashes blank while a wave is in flight.
 */

export type Chapter = {
  /** Where this chapter sits in remapped progress, 0–1. */
  center: number;
  /** Half-width of its visible window, in remapped progress. */
  window: number;
  label: string;
};

type Props = {
  frameCount: number;
  chapters: Chapter[];
  /** Rendered inside the sticky stage — chapter copy, rails, telemetry. */
  children: (state: { progress: number; degrees: number; activeChapter: string }) => React.ReactNode;
  desktopDir?: string;
  mobileDir?: string;
  scrollHeightVh?: number;
};

const LERP_FACTOR = 0.115;
const DWELL_WIDTH = 0.042;
const DWELL_PEAK = 2.6;
const LUT_SIZE = 2400;

export default function FrameSequence({
  frameCount,
  chapters,
  children,
  desktopDir = "/frames/desktop",
  mobileDir = "/frames/mobile",
  scrollHeightVh = 720,
}: Props) {
  const sequenceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [state, setState] = useState({ progress: 0, degrees: 0, activeChapter: chapters[0]?.label ?? "" });

  useEffect(() => {
    const sequence = sequenceRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!sequence || !stage || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    // The frames are upscaled to fill a high-DPI canvas, so resampling
    // quality is the single biggest lever on how sharp this looks.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileMedia = window.matchMedia("(max-width: 780px)");

    let useMobile = mobileMedia.matches;
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
      `${useMobile ? mobileDir : desktopDir}/frame-${String(index + 1).padStart(4, "0")}.webp`;

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(stage!.clientWidth * dpr);
      const height = Math.round(stage!.clientHeight * dpr);
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
        lastDrawn = -1;
        // Resizing a canvas resets its context state, smoothing included.
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
      ctx!.fillStyle = "#140A10";
      ctx!.fillRect(0, 0, width, height);

      // Mobile lifts the focal point so chapter copy can sit underneath.
      const coverScale = useMobile
        ? Math.max(width / image.naturalWidth, (height * 0.66) / image.naturalHeight)
        : Math.max(width / image.naturalWidth, height / image.naturalHeight);

      const drawWidth = image.naturalWidth * coverScale;
      const drawHeight = image.naturalHeight * coverScale;
      const x = (width - drawWidth) / 2;
      const y = useMobile ? height * 0.34 - drawHeight / 2 : (height - drawHeight) / 2;

      ctx!.drawImage(image, x, y, drawWidth, drawHeight);
      lastDrawn = resolved;
    }

    // ── Dwell remap lookup table ──────────────────────────────────────────
    const rawAtEffective = new Float64Array(LUT_SIZE + 1);
    const centers = chapters.map((chapter) => chapter.center);

    (function buildLut() {
      const density = new Float64Array(LUT_SIZE + 1);
      let total = 0;
      for (let i = 0; i <= LUT_SIZE; i += 1) {
        const effective = i / LUT_SIZE;
        let value = 1;
        for (const center of centers) {
          const delta = (effective - center) / DWELL_WIDTH;
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
        if (rawAtEffective[mid] < raw) low = mid + 1;
        else high = mid;
      }
      const index = Math.max(1, low);
      const left = rawAtEffective[index - 1];
      const span = rawAtEffective[index] - left || 1;
      return Math.max(0, Math.min(1, (index - 1 + (raw - left) / span) / LUT_SIZE));
    }

    function tick() {
      if (!pageVisible || reducedMotion || cancelled) return;

      const raw = Math.max(0, Math.min(1, (window.scrollY - sequenceTop) / sequenceDistance));
      const effective = remapProgress(raw);

      const target = Math.round(effective * (frameCount - 1));
      currentFrame += (target - currentFrame) * LERP_FACTOR;
      drawFrame(Math.round(currentFrame));

      // Chapter state is driven by un-smoothed progress so copy is never
      // late relative to the frame the viewer is actually looking at.
      let active = chapters[0];
      let nearest = Infinity;
      for (const chapter of chapters) {
        const distance = Math.abs(effective - chapter.center);
        if (distance < nearest) {
          nearest = distance;
          active = chapter;
        }
      }

      setState((previous) => {
        const degrees = Math.round(effective * 360);
        if (
          previous.degrees === degrees &&
          previous.activeChapter === active.label &&
          Math.abs(previous.progress - raw) < 0.002
        ) {
          return previous;
        }
        return { progress: raw, degrees, activeChapter: active.label };
      });

      rafId = requestAnimationFrame(tick);
    }

    async function init() {
      resizeCanvas();
      updateMetrics();

      if (reducedMotion) {
        const poster = Math.round(0.2 * (frameCount - 1));
        await loadFrame(poster);
        drawFrame(poster);
        setReady(true);
        return;
      }

      const critical = Array.from(
        new Set([0, ...centers.map((c) => Math.round(c * (frameCount - 1))), frameCount - 1]),
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

      void loadInBatches(
        Array.from({ length: frameCount }, (_, i) => i).filter((i) => !critical.includes(i)),
      );
    }

    const onResize = () => {
      resizeCanvas();
      updateMetrics();
    };
    const onMediaChange = (event: MediaQueryListEvent) => {
      useMobile = event.matches;
      lastDrawn = -1;
      loaded.fill(0);
      promises.fill(null);
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

    window.addEventListener("resize", onResize, { passive: true });
    mobileMedia.addEventListener("change", onMediaChange);
    document.addEventListener("visibilitychange", onVisibility);

    void init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      mobileMedia.removeEventListener("change", onMediaChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [frameCount, chapters, desktopDir, mobileDir]);

  return (
    <section
      ref={sequenceRef}
      style={{ height: `${scrollHeightVh}vh` }}
      className="relative"
      aria-label="The Anju Diam solitaire, viewed through a full rotation"
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full"
          role="img"
          aria-label="A diamond solitaire ring in 18-karat gold rotating slowly through a full turn under warm light."
        />
        {!ready && (
          <div
            className="absolute inset-0 z-50 grid place-content-center gap-8 bg-ink"
            role="status"
            aria-live="polite"
          >
            <img src="/logo/mark-gold.webp" alt="Anju Diam" width={340} height={259} className="w-[120px] h-auto" />
            <div className="h-px w-56 overflow-hidden bg-ivory/15">
              <div
                className="h-full origin-left bg-gold transition-transform duration-500"
                style={{ transform: `scaleX(${loadProgress})` }}
              />
            </div>
            <span className="label text-taupe">{Math.round(loadProgress * 100)}%</span>
          </div>
        )}
        {children(state)}
      </div>
    </section>
  );
}
