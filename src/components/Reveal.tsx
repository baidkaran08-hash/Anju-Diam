"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Fades and lifts a block into view once, the first time it is scrolled to.
 *
 * A single shared IntersectionObserver would be marginally cheaper, but at the
 * handful of instances per page this carries, one observer per element is
 * simpler and disconnects itself the moment it has fired.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  /** How much of the element must be visible before it fires, 0–1. */
  amount = 0.18,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Anything already on screen at mount should not animate in late.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: amount, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [amount]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
