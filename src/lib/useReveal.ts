"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when an element first enters the viewport. Pair with the
 * `data-[visible=true]:` variants on the element for the transition.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(rootMargin = "-12% 0px") {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, visible };
}
