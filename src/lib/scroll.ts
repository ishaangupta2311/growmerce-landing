import { create } from "zustand";

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smooth 0→1 ramp between two edges. */
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
};

/** Frame-rate independent damping — `lerp` with a half-life instead of a rate. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

type Measured = { top: number; height: number };

/**
 * Per-frame scroll state.
 *
 * Deliberately a plain mutable object rather than React state: the 3D scene
 * reads it inside `useFrame` every frame, and pushing that through React would
 * re-render the whole tree 60 times a second. Discrete state that the DOM
 * genuinely needs to re-render on lives in `useScene` below.
 */
export const scroll = {
  /** Raw smoothed scroll offset in px. */
  y: 0,
  /** 0→1 across the scrollable height of the document. */
  progress: 0,
  /** px per second, signed. */
  velocity: 0,
  /** Viewport height, cached. */
  vh: typeof window === "undefined" ? 900 : window.innerHeight,
  /** 0 = hand hovering above the cart, 1 = fingertip on the handle. */
  contact: 0,
  /** 0 = steel cart, 1 = fully digitised. Only starts once `contact` is 1. */
  digitize: 0,
  /** Per-section 0→1 progress, keyed by the id passed to `registerSection`. */
  sections: new Map<string, number>(),
  /** Set when the user prefers reduced motion — scene damps harder, no float. */
  reducedMotion: false,
};

const measured = new Map<string, { el: HTMLElement; rect: Measured }>();

export function registerSection(id: string, el: HTMLElement) {
  measured.set(id, { el, rect: { top: 0, height: 0 } });
  measureSections();
  return () => {
    measured.delete(id);
    scroll.sections.delete(id);
  };
}

/** Re-reads layout. Called on resize and after fonts/images settle. */
export function measureSections() {
  if (typeof window === "undefined") return;
  scroll.vh = window.innerHeight;
  const pageY = window.scrollY;
  for (const entry of measured.values()) {
    const box = entry.el.getBoundingClientRect();
    entry.rect.top = box.top + pageY;
    entry.rect.height = box.height;
  }
}

export function sectionProgress(id: string) {
  return scroll.sections.get(id) ?? 0;
}

/** Absolute document position of a registered section, for px-level staging. */
export function sectionRect(id: string): { top: number; height: number } | null {
  const entry = measured.get(id);
  return entry ? entry.rect : null;
}

/**
 * Recomputes every derived value from a new scroll offset. Called once per
 * frame by `ScrollDriver`.
 */
export function updateScroll(y: number, velocity: number) {
  const doc = document.documentElement;
  const scrollable = Math.max(1, doc.scrollHeight - scroll.vh);

  scroll.y = y;
  scroll.velocity = velocity;
  scroll.progress = clamp01(y / scrollable);

  // Per-section progress: 0 as the section's top edge enters the bottom of the
  // viewport, 1 as its bottom edge leaves the top.
  for (const [id, { rect }] of measured) {
    const span = rect.height + scroll.vh;
    scroll.sections.set(id, clamp01((y + scroll.vh - rect.top) / span));
  }

  const hero = measured.get("hero")?.rect;
  const outro = measured.get("outro")?.rect;

  // The hand meets the handle 45% of the way through the hero scroll.
  const touchAt = hero ? hero.top + hero.height * 0.45 : scroll.vh * 0.45;
  // Digitisation is complete by the time the outro is centred in the viewport.
  const doneAt = outro ? outro.top - scroll.vh * 0.35 : scrollable;

  scroll.contact = smoothstep(touchAt - scroll.vh * 0.55, touchAt, y);
  scroll.digitize = smoothstep(touchAt, Math.max(touchAt + 1, doneAt), y);
}

/* -------------------------------------------------------------------------
   Discrete state — changes rarely, so React may re-render on it.
------------------------------------------------------------------------- */

type SceneState = {
  /** Product ids that have dropped into the cart, in collection order. */
  collected: string[];
  /** Index of the product section currently holding the viewport, -1 if none. */
  activeIndex: number;
  /** True once the WebGL scene has drawn its first frame. */
  sceneReady: boolean;
  collect: (id: string) => void;
  uncollect: (id: string) => void;
  setActiveIndex: (i: number) => void;
  setSceneReady: (v: boolean) => void;
};

export const useScene = create<SceneState>((set) => ({
  collected: [],
  activeIndex: -1,
  sceneReady: false,
  collect: (id) =>
    set((s) => (s.collected.includes(id) ? s : { collected: [...s.collected, id] })),
  uncollect: (id) =>
    set((s) =>
      s.collected.includes(id)
        ? { collected: s.collected.filter((c) => c !== id) }
        : s,
    ),
  setActiveIndex: (i) => set((s) => (s.activeIndex === i ? s : { activeIndex: i })),
  setSceneReady: (v) => set({ sceneReady: v }),
}));
