"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import {
  measureSections,
  scroll,
  updateScroll,
  useScene,
} from "@/lib/scroll";
import { PRODUCTS } from "@/lib/products";

/**
 * Owns the single source of scroll truth for the whole page.
 *
 * Renders nothing. It runs Lenis for smoothing, pushes the resulting offset
 * into the mutable `scroll` object each frame, and derives the two pieces of
 * discrete state the DOM cares about: which product section is active, and
 * which products have dropped into the cart.
 */
export default function ScrollDriver() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroll.reducedMotion = reduced;

    const lenis = new Lenis({
      // A long lerp is what gives the cart its weight — the 3D rig damps toward
      // an already-smoothed target, so this value sets the overall inertia.
      lerp: reduced ? 1 : 0.085,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
      smoothWheel: !reduced,
      autoRaf: false,
    });

    let lastY = window.scrollY;
    let lastTime = performance.now();
    let lastDigitizeWritten = -1;
    let raf = 0;

    const root = document.documentElement;

    const frame = (time: number) => {
      lenis.raf(time);

      const dt = Math.min(0.1, (time - lastTime) / 1000) || 1 / 60;
      lastTime = time;

      const y = lenis.scroll;
      const velocity = (y - lastY) / dt;
      lastY = y;

      updateScroll(y, velocity);

      // Expose digitisation to CSS so 2D elements can tint alongside the model.
      if (Math.abs(scroll.digitize - lastDigitizeWritten) > 0.004) {
        lastDigitizeWritten = scroll.digitize;
        root.style.setProperty("--digitize", scroll.digitize.toFixed(3));
      }

      syncProducts();

      raf = requestAnimationFrame(frame);
    };

    const { collect, uncollect, setActiveIndex } = useScene.getState();

    /**
     * A product is "in the cart" once its section has been scrolled past its
     * own midpoint. Reversible, so scrolling back up empties the cart again.
     */
    const syncProducts = () => {
      let active = -1;
      for (let i = 0; i < PRODUCTS.length; i++) {
        const p = PRODUCTS[i];
        const progress = scroll.sections.get(p.id) ?? 0;
        if (progress > 0.3 && progress < 0.85) active = i;
        if (progress >= 0.56) collect(p.id);
        else uncollect(p.id);
      }
      setActiveIndex(active);
    };

    raf = requestAnimationFrame(frame);

    const onResize = () => {
      measureSections();
      lenis.resize();
    };
    window.addEventListener("resize", onResize);

    // Layout shifts after fonts load and after the canvas mounts.
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    document.fonts?.ready.then(onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      lenis.destroy();
    };
  }, []);

  return null;
}
