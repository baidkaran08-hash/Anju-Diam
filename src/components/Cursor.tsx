"use client";

import { useEffect } from "react";

/**
 * Gold dot plus a ring that lags behind it. The lag is the effect — the ring
 * catches up on a LERP, so movement reads as weight rather than a second
 * pointer. Suppressed on touch and for reduced-motion.
 */
export default function Cursor() {
  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cur-dot";
    ring.className = "cur-ring";
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    document.body.append(ring, dot);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let rafId = 0;

    const onMove = (event: MouseEvent) => {
      mx = event.clientX;
      my = event.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      document.body.classList.add("cursor-on");
    };
    const onLeave = () => document.body.classList.remove("cursor-on");

    const HOT = "a, button, input, select, textarea";
    const onOver = (event: MouseEvent) => {
      if ((event.target as Element)?.closest?.(HOT)) document.body.classList.add("cursor-hot");
    };
    const onOut = (event: MouseEvent) => {
      if ((event.target as Element)?.closest?.(HOT)) document.body.classList.remove("cursor-hot");
    };

    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      rafId = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      dot.remove();
      ring.remove();
      document.body.classList.remove("cursor-on", "cursor-hot");
    };
  }, []);

  return null;
}
