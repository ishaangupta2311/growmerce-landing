/**
 * Colour maths, and the step that turns whatever we scraped into a complete
 * `PreviewTheme`.
 *
 * The widget is drawn over the visitor's own storefront, so a half-filled theme
 * looks worse than no theme at all: a missing border on a dark store shows up as
 * a black hairline on black. `finishTheme` therefore derives every gap *from the
 * background we found* rather than from the light-mode defaults, which is what
 * makes a dark store come out looking deliberate.
 */

import { DEFAULT_THEME, type PreviewTheme } from "./types";

/* Enough named colours to cover what real stylesheets actually write out. */
const NAMED: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  orange: "#ffa500",
  purple: "#800080",
  pink: "#ffc0cb",
  brown: "#a52a2a",
  grey: "#808080",
  gray: "#808080",
  silver: "#c0c0c0",
  navy: "#000080",
  teal: "#008080",
  olive: "#808000",
  maroon: "#800000",
  lime: "#00ff00",
  aqua: "#00ffff",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  fuchsia: "#ff00ff",
  beige: "#f5f5dc",
  ivory: "#fffff0",
  gold: "#ffd700",
  tan: "#d2b48c",
  crimson: "#dc143c",
  indigo: "#4b0082",
  khaki: "#f0e68c",
  salmon: "#fa8072",
  coral: "#ff7f50",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  whitesmoke: "#f5f5f5",
  gainsboro: "#dcdcdc",
  linen: "#faf0e6",
  snow: "#fffafa",
};

const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => clampByte(c).toString(16).padStart(2, "0")).join("")}`;
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = Math.max(0, Math.min(1, s));
  const lum = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * lum - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x];
  const m = lum - c / 2;
  return toHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

/**
 * Any CSS colour we are likely to meet → `#rrggbb`. Returns null for values we
 * must not treat as a colour: `transparent`, `currentColor`, alpha 0, gradients.
 * The bare `r, g, b` triplet is Shopify Dawn's custom-property convention.
 */
export function parseColour(input: string): string | null {
  const value = input.trim().toLowerCase().replace(/;$/, "").trim();
  if (!value || value.length > 64) return null;
  if (value === "transparent" || value === "currentcolor" || value === "inherit") return null;

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (/^[0-9a-f]{3}$/.test(hex)) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    if (/^[0-9a-f]{4}$/.test(hex)) {
      if (hex[3] === "0") return null;
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
    if (/^[0-9a-f]{8}$/.test(hex)) {
      if (Number.parseInt(hex.slice(6), 16) === 0) return null;
      return `#${hex.slice(0, 6)}`;
    }
    return null;
  }

  const fn = value.match(/^(rgba?|hsla?)\(([^)]+)\)$/);
  if (fn) {
    /* Both the legacy comma syntax and the modern `r g b / a` space syntax. */
    const parts = fn[2].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
    if (parts.length < 3) return null;
    if (parts.length >= 4) {
      const alpha = parts[3].endsWith("%") ?
        Number.parseFloat(parts[3]) / 100
      : Number.parseFloat(parts[3]);
      if (Number.isFinite(alpha) && alpha < 0.15) return null;
    }
    const nums = parts.slice(0, 3).map((p) => Number.parseFloat(p));
    if (nums.some((n) => !Number.isFinite(n))) return null;

    if (fn[1].startsWith("hsl")) {
      return hslToHex(nums[0], nums[1] / 100, nums[2] / 100);
    }
    const scaled = parts
      .slice(0, 3)
      .map((p, i) => (p.endsWith("%") ? (nums[i] / 100) * 255 : nums[i]));
    return toHex(scaled[0], scaled[1], scaled[2]);
  }

  /* Shopify Dawn: `--color-foreground: 18, 18, 18;` — a triplet with no fn. */
  const triplet = value.match(/^(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})$/);
  if (triplet) {
    const nums = [triplet[1], triplet[2], triplet[3]].map(Number);
    if (nums.some((n) => n > 255)) return null;
    return toHex(nums[0], nums[1], nums[2]);
  }

  return NAMED[value] ?? null;
}

function channels(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** HSL saturation, 0–1. Used to tell a brand colour from a shade of grey. */
export function saturation(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const l = (max + min) / 2;
  return (max - min) / (l > 0.5 ? 2 - max - min : max + min);
}

/** Straight-line blend in sRGB. Good enough for hairlines and muted text. */
export function mix(a: string, b: string, weight: number): string {
  const t = Math.max(0, Math.min(1, weight));
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function isDark(hex: string): boolean {
  return relativeLuminance(hex) < 0.4;
}

/**
 * Fills the gaps in a scraped theme and guarantees the result is legible.
 * Derived values hang off `background`, so this works the same on a white store
 * and a near-black one.
 */
export function finishTheme(partial: Partial<PreviewTheme>): PreviewTheme {
  const background = partial.background ?? DEFAULT_THEME.background;
  const dark = isDark(background);

  let text = partial.text ?? (dark ? "#f4f4f4" : DEFAULT_THEME.text);
  /* Scraped pairs are sometimes nonsense (a light body colour declared over a
     light background because the real rule lives on an inner element). If the
     pair is unreadable, keep the background and replace the text. */
  if (contrastRatio(text, background) < 3) {
    text = dark ? "#f4f4f4" : DEFAULT_THEME.text;
  }

  const surface =
    partial.surface ??
    (dark ?
      mix(background, "#ffffff", 0.08)
      /* On light stores the panel should read as "lifted", which means white —
         unless the page is already white, where a hairline does the work. */
    : relativeLuminance(background) > 0.9 ? "#ffffff"
    : mix(background, "#ffffff", 0.6));

  let accent = partial.accent ?? (dark ? "#ffffff" : DEFAULT_THEME.accent);
  /* The same sanity check `text` gets, for the same reason. When we could only
     read a stylesheet — no browser, so nothing was ever painted — the accent is
     a guess at which declared colour a button uses, and the guess is sometimes
     the page's own white. An accent that vanishes into the panel it sits on is
     not a brand colour, it is a button the visitor cannot see, so we keep the
     store's background and drop back to ink. nykaa.com, screenshotless because
     its edge refuses headless Chrome, came back #ffffff on #ffffff. */
  if (contrastRatio(accent, surface) < 2) {
    accent = dark ? "#ffffff" : DEFAULT_THEME.accent;
  }

  const onWhite = contrastRatio(accent, "#ffffff");
  const onInk = contrastRatio(accent, "#111111");
  const accentText =
    partial.accentText ??
    /* White first — that is what most brands ship — and only step down to ink
       when white would actually fail. */
    (onWhite >= 4.5 ? "#ffffff"
    : onInk >= 4.5 ? "#111111"
    : onWhite >= onInk ? "#ffffff"
    : "#111111");

  let muted = partial.muted ?? mix(text, background, 0.42);
  if (contrastRatio(muted, background) < 3) muted = mix(text, background, 0.2);

  const border = partial.border ?? mix(background, text, dark ? 0.18 : 0.12);

  const radius = Math.max(0, Math.min(24, Math.round(partial.radius ?? DEFAULT_THEME.radius)));

  const fontFamily = partial.fontFamily?.trim().slice(0, 160) || null;

  return { background, surface, text, muted, accent, accentText, border, radius, fontFamily };
}
