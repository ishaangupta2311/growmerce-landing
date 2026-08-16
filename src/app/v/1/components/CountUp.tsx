"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

/** Ticks a number up from `from` to `to` once it scrolls into view. */
export default function CountUp({
  from = 0,
  to,
  duration = 1100,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(from);
  // Lazy-initialized once; reading matchMedia in render/init (not inside the
  // effect body) keeps the effect free of a synchronous setState call.
  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (reduceMotion) return;
    const node = ref.current;
    if (!node) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(1, elapsed / duration);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(from + (to - from) * eased);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [from, to, duration, reduceMotion]);

  const display = reduceMotion ? to : value;

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
