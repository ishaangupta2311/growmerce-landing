"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../nightmarket.module.css";

/* A small torch beam that follows the pointer across the street section. Pure
   decoration: it only ever brightens what is already legible, it never appears
   on touch devices, and it opts out entirely under reduced motion. */
export default function Torch({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      frame = 0;
      el.style.setProperty("--tx", `${x}px`);
      el.style.setProperty("--ty", `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const onEnter = () => setOn(true);
    const onLeave = () => setOn(false);

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`${styles.torch} ${on ? styles.torchOn : ""} pointer-events-none absolute inset-0 -z-10 ${className ?? ""}`}
    />
  );
}
