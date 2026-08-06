"use client";

import { useEffect, useRef } from "react";
import { registerSection } from "./scroll";

/**
 * Registers a DOM section with the scroll engine so `scroll.sections` carries a
 * 0→1 progress value for it. Attach the returned ref to the section element.
 */
export function useSection<T extends HTMLElement = HTMLElement>(id: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return registerSection(id, el);
  }, [id]);

  return ref;
}
