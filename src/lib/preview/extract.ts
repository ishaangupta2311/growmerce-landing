/**
 * Reading a store's identity and colours out of its HTML.
 *
 * Two independent jobs live here. `extractMeta` is cheap and always runs: name,
 * favicon, logo. `extractStylesheetTheme` is the fallback for when we could not
 * open a real browser — it reads the CSS the way a person would skim it, looking
 * first for the theme's own custom properties (Shopify's Dawn and its many
 * descendants all name them the same way) and only guessing from colour
 * frequency when there is nothing declarative to find.
 */

import { parse, type HTMLElement } from "node-html-parser";

import { BROWSER_HEADERS } from "./fetch-site";
import { safeFetch } from "./store-url";
import { parseColour, saturation, relativeLuminance } from "./theme";
import type { PreviewTheme } from "./types";

const MAX_STYLESHEETS = 3;
const STYLESHEET_MAX_BYTES = 300 * 1024;
const STYLESHEET_TIMEOUT_MS = 6_000;
/* Past this there is nothing left to learn, and the frequency scan is O(n). */
const MAX_CSS_CHARS = 1_200_000;

export type SiteMeta = {
  title: string | null;
  favicon: string | null;
  logo: string | null;
};

function parseHtml(html: string): HTMLElement {
  return parse(html, { comment: false });
}

function absolute(href: string | undefined, base: string): string | null {
  if (!href) return null;
  const value = href.trim();
  if (!value || value.startsWith("javascript:")) return null;
  if (value.startsWith("data:image/")) return value.length <= 200_000 ? value : null;
  try {
    const url = new URL(value, base);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    /* The preview renders on our own https page, where an http image is simply
       blocked. Stores that still emit http URLs in their metadata serve the same
       asset over TLS, so upgrade rather than hand the client a broken link. */
    if (url.protocol === "http:" && base.startsWith("https:")) url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

function metaContent(root: HTMLElement, name: string): string | undefined {
  return (
    root.querySelector(`meta[property="${name}"]`)?.getAttribute("content") ??
    root.querySelector(`meta[name="${name}"]`)?.getAttribute("content")
  );
}

/** First usable image URL on an `<img>`, allowing for the usual lazy-load dance. */
function imageSource(img: HTMLElement): string | undefined {
  const direct = img.getAttribute("src") ?? img.getAttribute("data-src");
  if (direct?.trim()) return direct;
  const set = img.getAttribute("srcset") ?? img.getAttribute("data-srcset");
  return set?.trim().split(",")[0]?.trim().split(/\s+/)[0];
}

export function extractMeta(html: string, finalUrl: string): SiteMeta {
  const root = parseHtml(html);

  const rawTitle =
    metaContent(root, "og:site_name") ??
    metaContent(root, "og:title") ??
    root.querySelector("title")?.text;
  const title = rawTitle?.replace(/\s+/g, " ").trim().slice(0, 120) || null;

  const icons = root.querySelectorAll("link[rel]").filter((link) => {
    const rel = link.getAttribute("rel")?.toLowerCase() ?? "";
    return rel.includes("icon") && !rel.includes("mask-icon");
  });
  const touch = icons.find((link) => link.getAttribute("rel")?.toLowerCase().includes("apple-touch"));
  const favicon =
    absolute(touch?.getAttribute("href"), finalUrl) ??
    absolute(icons[0]?.getAttribute("href"), finalUrl) ??
    absolute("/favicon.ico", finalUrl);

  /* Header logos are nearly always labelled. Scan in document order and stop at
     the first image that says so — the header is at the top of the document, so
     order alone does most of the filtering. */
  let logo: string | null = null;
  for (const img of root.querySelectorAll("img").slice(0, 60)) {
    const hint = [
      img.getAttribute("src") ?? "",
      img.getAttribute("alt") ?? "",
      img.getAttribute("class") ?? "",
      img.getAttribute("id") ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!/logo|brandmark|wordmark/.test(hint)) continue;
    logo = absolute(imageSource(img), finalUrl);
    if (logo) break;
  }
  logo ??= absolute(metaContent(root, "og:image"), finalUrl);

  return { title, favicon, logo };
}

/* Names the big platforms and their theme families actually ship, best first. */
const PROP_CANDIDATES: Record<string, string[]> = {
  background: [
    "color-base-background-1",
    "color-background",
    "colour-background",
    "background-color",
    "color-bg",
    "bg-color",
    "body-bg",
    "color-body-bg",
  ],
  text: [
    "color-base-text",
    "color-foreground",
    "color-text",
    "text-color",
    "body-color",
    "color-body-text",
  ],
  accent: [
    "color-base-accent-1",
    "color-accent",
    "accent-color",
    "color-button",
    "button-background",
    "color-primary",
    "primary-color",
    "color-brand",
    "brand-color",
    "brand-primary",
  ],
  accentText: [
    "color-base-solid-button-labels",
    "color-button-text",
    "button-text-color",
    "color-on-accent",
  ],
  border: ["color-border", "border-color", "color-base-border"],
};

const RADIUS_PROPS = [
  "buttons-radius",
  "button-radius",
  "border-radius-button",
  "corner-radius",
  "border-radius",
];

const FONT_PROPS = [
  "font-heading-family",
  "font-header-family",
  "heading-font-family",
  "font-heading",
];

/** First declaration wins: in practice that is the `:root` / base-scheme block. */
function customProperties(css: string): Map<string, string> {
  const props = new Map<string, string>();
  const pattern = /--([a-z0-9_-]{2,48})\s*:\s*([^;{}]{1,80})/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(css)) !== null) {
    const name = match[1].toLowerCase();
    if (!props.has(name)) props.set(name, match[2].trim());
  }
  return props;
}

function firstColour(props: Map<string, string>, names: string[]): string | undefined {
  for (const name of names) {
    const raw = props.get(name);
    if (!raw) continue;
    const colour = parseColour(raw);
    if (colour) return colour;
  }
  return undefined;
}

function toPx(raw: string): number | undefined {
  const match = raw.match(/^([\d.]+)\s*(px|rem|em)?/);
  if (!match) return undefined;
  const n = Number.parseFloat(match[1]);
  if (!Number.isFinite(n)) return undefined;
  return match[2] === "rem" || match[2] === "em" ? n * 16 : n;
}

function buttonRadius(css: string, props: Map<string, string>): number | undefined {
  for (const name of RADIUS_PROPS) {
    const raw = props.get(name);
    if (!raw) continue;
    const px = toPx(raw);
    if (px !== undefined) return px;
  }
  const rule = css.match(
    /\.(?:btn|button|shopify-payment-button__button)[^{}]{0,160}\{[^{}]{0,600}?border-radius\s*:\s*([^;}]{1,24})/i,
  );
  return rule ? toPx(rule[1].trim()) : undefined;
}

function headingFont(css: string, props: Map<string, string>): string | undefined {
  for (const name of FONT_PROPS) {
    const raw = props.get(name);
    if (raw && !raw.startsWith("var(")) return raw;
  }
  const rule = css.match(/(^|})\s*([^{}]{0,200}\bh[12]\b[^{}]{0,200})\{([^{}]{0,600})\}/i);
  const family = rule?.[3].match(/font-family\s*:\s*([^;}]{1,120})/i)?.[1];
  return family && !family.trim().startsWith("var(") ? family.trim() : undefined;
}

/**
 * Last resort for the accent: the most-used colour that a designer would call a
 * colour. Greys, near-white and near-black are excluded because every stylesheet
 * is mostly made of them, and weighting by saturation keeps a lightly-used brand
 * red ahead of a heavily-used beige.
 */
function frequencyAccent(css: string): string | undefined {
  const counts = new Map<string, number>();
  const pattern = /#[0-9a-f]{3,8}\b|rgba?\([^)]{5,60}\)|hsla?\([^)]{5,60}\)/gi;
  let match: RegExpExecArray | null;
  let seen = 0;
  while ((match = pattern.exec(css)) !== null && seen < 20_000) {
    seen += 1;
    const colour = parseColour(match[0]);
    if (!colour) continue;
    counts.set(colour, (counts.get(colour) ?? 0) + 1);
  }

  let best: string | undefined;
  let bestScore = 0;
  for (const [colour, count] of counts) {
    const sat = saturation(colour);
    const lum = relativeLuminance(colour);
    if (sat < 0.18 || lum > 0.82 || lum < 0.02) continue;
    const score = Math.log1p(count) * sat;
    if (score > bestScore) {
      bestScore = score;
      best = colour;
    }
  }
  return best;
}

/** Theme-ish filenames first; a store's brand lives in `theme.css`, not `swiper.css`. */
function rankStylesheet(href: string): number {
  const name = href.toLowerCase();
  if (/(theme|base|main|global|style|app|custom)\.[\w-]*css/.test(name)) return 0;
  if (/vendor|swiper|slick|font-awesome|icons?\.css|normalize|reset/.test(name)) return 2;
  return 1;
}

async function collectCss(root: HTMLElement, finalUrl: string, budgetMs: number): Promise<string> {
  const inline = root
    .querySelectorAll("style")
    .map((node) => node.text)
    .join("\n");

  const hrefs = root
    .querySelectorAll("link")
    .filter((link) => {
      const rel = link.getAttribute("rel")?.toLowerCase() ?? "";
      const media = link.getAttribute("media")?.toLowerCase() ?? "";
      return rel.split(/\s+/).includes("stylesheet") && media !== "print";
    })
    .map((link) => absolute(link.getAttribute("href"), finalUrl))
    .filter((href): href is string => href !== null);

  const chosen = [...new Set(hrefs)]
    .sort((a, b) => rankStylesheet(a) - rankStylesheet(b))
    .slice(0, MAX_STYLESHEETS);

  const fetched = await Promise.all(
    chosen.map(async (href) => {
      try {
        const result = await safeFetch(href, {
          timeoutMs: Math.min(STYLESHEET_TIMEOUT_MS, budgetMs),
          maxBytes: STYLESHEET_MAX_BYTES,
          headers: { ...BROWSER_HEADERS, accept: "text/css,*/*;q=0.1", referer: finalUrl },
        });
        return result.body;
      } catch {
        return "";
      }
    }),
  );

  return [inline, ...fetched].join("\n").slice(0, MAX_CSS_CHARS);
}

/**
 * Everything we can learn about a store's palette without running its code.
 * Returns null when nothing at all was recognisable, so the caller can keep
 * `themeSource` honest.
 */
export async function extractStylesheetTheme(
  html: string,
  finalUrl: string,
  budgetMs = STYLESHEET_TIMEOUT_MS,
): Promise<Partial<PreviewTheme> | null> {
  const root = parseHtml(html);
  const css = await collectCss(root, finalUrl, budgetMs);
  if (!css.trim()) return null;

  const props = customProperties(css);
  const theme: Partial<PreviewTheme> = {};

  const background = firstColour(props, PROP_CANDIDATES.background);
  if (background) theme.background = background;

  const text = firstColour(props, PROP_CANDIDATES.text);
  if (text) theme.text = text;

  const border = firstColour(props, PROP_CANDIDATES.border);
  if (border) theme.border = border;

  const accentText = firstColour(props, PROP_CANDIDATES.accentText);
  if (accentText) theme.accentText = accentText;

  const accent =
    firstColour(props, PROP_CANDIDATES.accent) ??
    parseColour(metaContent(root, "theme-color") ?? "") ??
    frequencyAccent(css) ??
    undefined;
  if (accent) theme.accent = accent;

  const radius = buttonRadius(css, props);
  if (radius !== undefined) theme.radius = radius;

  const font = headingFont(css, props);
  if (font) theme.fontFamily = font;

  return Object.keys(theme).length > 0 ? theme : null;
}
