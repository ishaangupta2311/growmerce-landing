"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type RevealCallback = () => void;

let sharedObserver: IntersectionObserver | null = null;
const revealCallbacks = new Map<Element, RevealCallback>();

function getSharedObserver() {
  if (sharedObserver) return sharedObserver;

  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const callback = revealCallbacks.get(entry.target);
        if (!callback) continue;

        revealCallbacks.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
        callback();
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );

  return sharedObserver;
}

function observeReveal(node: Element, callback: RevealCallback) {
  const observer = getSharedObserver();
  revealCallbacks.set(node, callback);
  observer.observe(node);

  return () => {
    revealCallbacks.delete(node);
    observer.unobserve(node);
    if (revealCallbacks.size === 0) {
      observer.disconnect();
      sharedObserver = null;
    }
  };
}

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger offset in ms, applied via CSS transition-delay. */
  delay?: number;
};

/** Fades content up once it scrolls into view (see .reveal in globals.css). */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    return observeReveal(node, () => setShown(true));
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown}
      className={`reveal ${className ?? ""}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
