/**
 * The stage that makes the preview feel real: a picture of the visitor's own
 * shop, plus the colours the browser actually resolved rather than the ones the
 * stylesheet claims.
 *
 * This is the expensive step and the one most likely to be unavailable (no
 * Chrome on the box, a store that hangs, a consent wall). It is written to fail
 * softly everywhere — every return path is a partial result, never an
 * exception the caller has to interpret — and to hold a hard wall-clock budget,
 * because a preview page that never lands is worse than one with no screenshot.
 */

import { existsSync } from "node:fs";

import puppeteer, { type Browser, type HTTPRequest, type Page } from "puppeteer-core";

import { assertPublicHost, isSyntacticallyPublicHost } from "./store-url";
import { contrastRatio, parseColour, saturation } from "./theme";
import type { PreviewTheme } from "./types";

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };
/** Whole stage, launch included. Past this the visitor is just staring at a spinner. */
const TOTAL_BUDGET_MS = 15_000;
const NAV_TIMEOUT_MS = 12_000;
const NETWORK_IDLE_MS = 4_000;
const MODAL_BUDGET_MS = 300;

/* Well-known locations, in the order a developer machine is likely to have them. */
const MAC_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
];

const LINUX_CANDIDATES = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
];

/* Anything that draws over the page, phones home, or streams. Blocking these
   costs nothing visually and takes seconds off the average capture. */
const BLOCKED_HOSTS =
  /(google-analytics|googletagmanager|analytics\.|doubleclick|facebook\.net|connect\.facebook|hotjar|intercom|drift\.com|tawk\.to|zdassets|zendesk|klaviyo|attentivemobile|postscript|clarity\.ms|segment\.(io|com)|mixpanel|criteo|taboola|outbrain|snapchat|tiktok|bing\.com\/bat|pinterest|yotpo|trustpilot|gorgias|privy|justuno)/i;

export type BrowserTheme = Partial<PreviewTheme>;

export type CaptureResult = {
  /** data:image/jpeg;base64,… or null when the shot itself failed. */
  screenshot: string | null;
  theme: BrowserTheme;
};

/** Shape crossing the page boundary: strings only, so it survives serialisation. */
type ButtonCandidate = {
  background: string;
  color: string;
  radius: string;
  /** Rendered px². Bigger buttons are likelier to be the page's real call to action. */
  area: number;
};

type RawComputed = {
  bodyBackground: string;
  documentBackground: string;
  text: string;
  /** Up to 20, in document order, so the pick can be scored rather than guessed. */
  buttons: ButtonCandidate[];
  link: string;
  font: string;
};

let resolvedExecutable: string | null | undefined;

/**
 * `CHROME_PATH` wins, then a real browser on this machine, then the serverless
 * bundle. The last one unpacks ~100 MB on first use, which is fine on Lambda and
 * a waste on a laptop that already has Chrome — hence the order.
 */
async function executablePath(): Promise<string | null> {
  if (resolvedExecutable !== undefined) return resolvedExecutable;

  const fromEnv = process.env.CHROME_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) {
    resolvedExecutable = fromEnv;
    return resolvedExecutable;
  }

  const local = (process.platform === "darwin" ? MAC_CANDIDATES : LINUX_CANDIDATES).find((path) =>
    existsSync(path),
  );
  if (local) {
    resolvedExecutable = local;
    return resolvedExecutable;
  }

  try {
    const { default: chromium } = await import("@sparticuz/chromium");
    resolvedExecutable = await chromium.executablePath();
  } catch (err) {
    console.warn("[preview] no Chrome available:", err instanceof Error ? err.message : err);
    resolvedExecutable = null;
  }
  return resolvedExecutable;
}

async function launch(executable: string): Promise<Browser> {
  const serverless = executable.includes("/tmp/") || process.env.AWS_LAMBDA_FUNCTION_NAME;
  let args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--hide-scrollbars",
    "--mute-audio",
    "--disable-background-networking",
    "--no-first-run",
  ];

  if (serverless) {
    const { default: chromium } = await import("@sparticuz/chromium");
    args = [...new Set([...chromium.args, ...args])];
  }

  return puppeteer.launch({
    executablePath: executable,
    headless: true,
    args,
    defaultViewport: VIEWPORT,
    protocolTimeout: TOTAL_BUDGET_MS,
  });
}

/**
 * The SSRF guard, again, from the other side.
 *
 * `safeFetch` only covers the HTML we pulled ourselves. The browser then goes
 * off and does its own thing: it follows the store's redirects, loads
 * subresources from wherever the markup points, and renders iframes — all of
 * which are requests our process makes to hosts we never chose. A store that
 * embeds `http://169.254.169.254/latest/meta-data/` gets it fetched unless this
 * handler says no.
 *
 * Two tiers, because hundreds of requests come through here: a name-only check
 * on everything (free), and a real DNS check on documents only (main frame and
 * iframes — the ones that could actually render a private response to something
 * that reads it back). Subresource DNS rebinding is knowingly accepted: a name
 * that passes the syntactic check and then resolves to a private address can
 * still be *requested* as an image or a script. It is blind — the page cannot
 * read a cross-origin image or a script that fails to parse — and closing it
 * would mean a DNS lookup per request.
 */
/* One DNS answer per host for a minute. An iframe-heavy storefront hits the same
   handful of hosts over and over, and this check sits on the critical path of
   the page load. Deliberately short-lived: a long cache would hand a rebinding
   attacker a stale "public" verdict, and a slow resolver must not be able to
   stall the stage, so the lookup itself is on a deadline and fails closed. */
const HOST_VERDICT_TTL_MS = 60_000;
const HOST_VERDICT_DEADLINE_MS = 2_000;
const hostVerdicts = new Map<string, { at: number; allowed: Promise<boolean> }>();

function documentHostAllowed(hostname: string): Promise<boolean> {
  const cached = hostVerdicts.get(hostname);
  if (cached && Date.now() - cached.at < HOST_VERDICT_TTL_MS) return cached.allowed;

  const allowed = withDeadline(
    assertPublicHost(hostname),
    HOST_VERDICT_DEADLINE_MS,
    `dns ${hostname}`,
  ).then(
    () => true,
    () => false,
  );
  hostVerdicts.set(hostname, { at: Date.now(), allowed });

  if (hostVerdicts.size > 200) {
    const oldest = hostVerdicts.keys().next();
    if (!oldest.done) hostVerdicts.delete(oldest.value);
  }
  return allowed;
}

async function handleRequest(
  request: HTTPRequest,
  page: Page,
  loaded: () => boolean,
): Promise<void> {
  const abort = () => void request.abort().catch(() => {});
  /* Both calls throw if the request already resolved — a race we cannot win and
     do not care about. */
  const proceed = () => void request.continue().catch(() => {});

  const type = request.resourceType();
  if (
    type === "media" ||
    /* Once the page we asked for is on screen, nothing may navigate away from
       it. Dismissing a pop-up means clicking things, and one wrong click on a
       "continue" link detaches the frame and takes the rest of the stage with
       it — this is the belt to that braces. */
    (loaded() && request.isNavigationRequest() && request.frame() === page.mainFrame()) ||
    (type !== "document" && BLOCKED_HOSTS.test(request.url()))
  ) {
    abort();
    return;
  }

  let target: URL;
  try {
    target = new URL(request.url());
  } catch {
    abort();
    return;
  }

  /* `data:`, `blob:` and `about:` never leave the process, so they carry no
     hostname and no risk. Anything else on the wire must be http(s). */
  if (target.protocol === "data:" || target.protocol === "blob:" || target.protocol === "about:") {
    proceed();
    return;
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    abort();
    return;
  }

  if (!isSyntacticallyPublicHost(target.hostname)) {
    abort();
    return;
  }

  if (type === "document" && !(await documentHostAllowed(target.hostname))) {
    abort();
    return;
  }

  proceed();
}

/** Cookie walls, newsletter and geo pop-ups, dismissed the way a shopper would. */
async function dismissOverlays(page: Page): Promise<void> {
  /* Same rule as readComputedTheme: no named functions inside the page. */
  await page.evaluate(() => {
    const ACCEPT = /^(accept|allow|agree|i agree|got it|ok|okay|close|no thanks|confirm)\b/i;
    /* Deliberately wider than "cookie": the thing standing between us and the
       shop is just as often a country picker or a 10%-off newsletter. */
    const OVERLAY =
      /cookie|consent|gdpr|privacy|popup|pop-up|modal|dialog|newsletter|subscribe|lightbox|welcome-?mat|geo|country|region|localization|localisation/i;

    /* Clicks are about to be fired at elements we only half understand. Kill any
       link navigation they trigger before it starts. */
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("a[href]")) event.preventDefault();
      },
      true,
    );

    /* Pass one: an explicitly labelled close control that is actually on screen.
       Every store has a "Close cart" button in its DOM; only the one belonging
       to an open overlay has a box inside the viewport, so visibility does the
       filtering that a name never could. Buttons only — following an `<a>`
       would lose us the storefront. */
    for (const el of Array.from(
      document.querySelectorAll<HTMLElement>('button, [role="button"]'),
    ).slice(0, 250)) {
      const label = `${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("title") ?? ""}`;
      if (!/^\s*(close|dismiss)\b/i.test(label)) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 8 || box.height < 8) continue;
      if (box.top < 0 || box.top > innerHeight || box.left < 0 || box.left > innerWidth) continue;
      el.click();
    }

    /* Pass two: the affirmative button inside anything that names itself as a
       banner or dialog. */
    for (const container of Array.from(
      document.querySelectorAll<HTMLElement>(
        '[role="dialog"], [role="alertdialog"], [aria-modal="true"], dialog[open],' +
          ' [class*="modal" i], [class*="popup" i], [class*="cookie" i], [class*="consent" i],' +
          ' [class*="newsletter" i], [id*="modal" i], [id*="popup" i], [id*="cookie" i],' +
          ' [id*="consent" i]',
      ),
    ).slice(0, 30)) {
      for (const button of Array.from(
        container.querySelectorAll<HTMLElement>('button, [type="button"], [type="submit"]'),
      ).slice(0, 12)) {
        if (ACCEPT.test((button.textContent ?? "").trim())) {
          button.click();
          break;
        }
      }
    }

    /* Pass three: whatever survived. Anything pinned over the page, stacked
       above it and large enough to ruin the shot goes. The header/main guard is
       what stops this from blanking a site whose whole layout hangs off a fixed
       wrapper — a real overlay contains neither. */
    /* A native <dialog> paints its scrim as `::backdrop`, a pseudo-element no
       amount of `display: none` on the dialog can reach. Closing it is the only
       thing that actually removes the dimming. */
    for (const el of Array.from(document.querySelectorAll("dialog"))) {
      if (el instanceof HTMLDialogElement && el.open) el.close();
    }

    /* The other scrim that is not an element: a state class on <html>/<body>
       whose stylesheet paints `body.modal-background::before` over everything.
       Kith dims its whole page this way, and no amount of hiding the dialog
       touches it — the flag has to come off. Only state-ish names are stripped,
       so the theme's own `template-index` survives. */
    const STATE =
      /(^|-)(modal|drawer|popup|overlay|lightbox|dialog|consent|cookie|newsletter)(-|$)|no-?scroll|scroll-?lock|overflow-hidden|-open$/i;
    for (const el of [document.documentElement, document.body]) {
      for (const name of Array.from(el.classList)) {
        if (STATE.test(name)) el.classList.remove(name);
      }
    }

    const header = document.querySelector("header");
    const main = document.querySelector("main");
    /* Self-declared overlays are queried by name rather than found by walking:
       a big storefront has tens of thousands of nodes and the pop-up is usually
       appended last, so any document-order cap would walk straight past it. */
    const suspects = new Set<HTMLElement>([
      ...document.querySelectorAll<HTMLElement>(
        '[role="dialog"], [role="alertdialog"], [aria-modal="true"], dialog[open],' +
          ' [class*="modal" i], [class*="popup" i], [class*="cookie" i], [class*="consent" i],' +
          ' [class*="newsletter" i], [id*="modal" i], [id*="popup" i], [id*="cookie" i],' +
          ' [id*="consent" i]',
      ),
      ...(() => {
        /* getComputedStyle is the cost here, so there is a ceiling — but it sits
           well above a normal storefront (Kith is ~7k nodes) because a pop-up is
           as likely to be spliced into the middle of the document as appended to
           the end. Past the ceiling, take both ends and skip the middle. */
        const all = Array.from(document.querySelectorAll<HTMLElement>("body *"));
        return all.length <= 12000 ? all : [...all.slice(0, 8000), ...all.slice(-4000)];
      })(),
    ]);

    for (const el of suspects) {
      const role = el.getAttribute("role");
      const style = getComputedStyle(el);
      /* Pinned, or claiming to be a dialog. Plain `position: absolute` is left
         alone: that is how every theme tints a hero image, and hiding those
         would quietly repaint the storefront we came to photograph. */
      if (style.position !== "fixed" && role !== "dialog" && role !== "alertdialog") continue;
      if (header && el.contains(header)) continue;
      if (main && el.contains(main)) continue;

      const box = el.getBoundingClientRect();
      if (box.width < 40 || box.top > innerHeight) continue;
      const coverage = (box.width * box.height) / (innerWidth * innerHeight);
      const named =
        role === "dialog" || role === "alertdialog" || OVERLAY.test(`${el.className} ${el.id}`);

      /* The scrim: the sheet of translucent grey a modal lays over the page. It
         is anonymous, it is usually `z-index: auto` (so no stacking test can see
         it), and leaving it behind dims the whole screenshot even after the
         dialog it belonged to is gone. Nothing else in a storefront is pinned,
         nearly full-bleed and see-through at once. */
      const alpha = Number(/rgba?\([^)]*?,\s*([\d.]+)\s*\)$/.exec(style.backgroundColor)?.[1]);
      const seeThrough = Number.isFinite(alpha) && alpha > 0 && alpha < 1;
      const blurs = Boolean(style.backdropFilter) && style.backdropFilter !== "none";
      const scrim = style.position === "fixed" && coverage >= 0.6 && (seeThrough || blurs);

      /* Something that says what it is only has to be big enough to be in the
         way; an anonymous pinned box has to be big enough *and* stacked above
         the page before we assume it is not part of the design. */
      const unwanted =
        scrim ||
        (named ? coverage >= 0.05 : coverage >= 0.25 && Number.parseInt(style.zIndex, 10) >= 5);
      if (unwanted) el.style.setProperty("display", "none", "important");
    }
  });
}

function readComputedTheme(page: Page): Promise<RawComputed> {
  /* Nothing in here may be a *named* function. Bundlers that preserve function
     names (esbuild's keepNames, which tsx turns on) rewrite `const f = () => {}`
     into a call to their own `__name` runtime helper — which lives in the Node
     bundle and not in the page, so the whole evaluate dies with
     "__name is not defined". Anonymous callbacks are left alone, so the tests
     below are inlined rather than shared.
     Raw CSS strings come back untouched; `parseColour` upstream already knows
     how to reject `transparent` and zero-alpha values, so the page does no
     judging of its own. */
  return page.evaluate(() => {
    /* Every filled button in the first viewport, not just the first one. Which of
       them is the brand's call to action is a judgement the page cannot make —
       it needs saturation and contrast maths — so the shortlist goes back to
       Node and gets scored there against the real colour utilities. */
    const buttons: {
      background: string;
      color: string;
      radius: string;
      area: number;
    }[] = [];
    for (const el of Array.from(
      document.querySelectorAll(
        'button, [role="button"], [type="submit"], .shopify-payment-button__button,' +
          /* Class-name matching, not just `.btn`/`.button`: hashed module names
             like `LPHero__btn` are how a modern theme ships its call to action,
             and an exact-token selector walks straight past them. Wrappers get
             caught too, but they are transparent and fall out below. */
          ' [class*="btn" i], [class*="button" i]',
      ),
    )) {
      if (buttons.length >= 20) break;
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (box.width <= 40 || box.height <= 20) continue;
      if (box.top >= innerHeight || box.bottom <= 0) continue;
      if (box.left >= innerWidth || box.right <= 0) continue;
      if (style.visibility === "hidden" || Number(style.opacity) <= 0.1) continue;
      if (style.backgroundColor === "transparent") continue;
      if (/rgba\([^)]*,\s*0(\.0+)?\)$/.test(style.backgroundColor)) continue;
      /* The one test that cannot be fooled: ask the page what is actually at
         that point. A closed cart drawer still reports a sensible box, and its
         "Add to Cart" buttons were beating real hero CTAs until this went in. */
      const hit = document.elementFromPoint(
        Math.min(Math.max(box.left + box.width / 2, 0), innerWidth - 1),
        Math.min(Math.max(box.top + box.height / 2, 0), innerHeight - 1),
      );
      if (!hit || (hit !== el && !el.contains(hit))) continue;
      buttons.push({
        background: style.backgroundColor,
        color: style.color,
        radius: style.borderTopLeftRadius,
        area: box.width * box.height,
      });
    }

    const link = Array.from(document.querySelectorAll("a")).find((el) => {
      const box = el.getBoundingClientRect();
      return box.width > 24 && box.height > 8 && box.top < innerHeight;
    });

    const heading = document.querySelector("h1, h2");

    return {
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      documentBackground: getComputedStyle(document.documentElement).backgroundColor,
      text: getComputedStyle(document.body).color,
      buttons,
      link: link ? getComputedStyle(link).color : "",
      font: heading ? getComputedStyle(heading).fontFamily : "",
    };
  });
}

function withDeadline<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms).unref?.();
    }),
  ]);
}

async function capture(browser: Browser, url: string): Promise<CaptureResult> {
  const page = await browser.newPage();
  let loaded = false;
  await page.setRequestInterception(true);
  page.on("request", (request) => void handleRequest(request, page, () => loaded));
  await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
  loaded = true;
  /* Give late-loading hero images a chance, but never wait on the tracker that
     polls forever — hence a grace period rather than `waitUntil: networkidle`. */
  await page.waitForNetworkIdle({ idleTime: 500, timeout: NETWORK_IDLE_MS }).catch(() => {});

  await withDeadline(dismissOverlays(page), MODAL_BUDGET_MS, "overlay dismissal").catch(() => {});
  /* Twice, with a beat in between: plenty of stores hold their welcome mat or
     newsletter pop-up back on a timer, so the first sweep runs before the thing
     it is looking for exists. The pass is idempotent and the beat doubles as the
     dismissal animation finishing. */
  await new Promise((resolve) => setTimeout(resolve, 450));
  await withDeadline(dismissOverlays(page), MODAL_BUDGET_MS, "overlay dismissal").catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 150));

  const raw = await readComputedTheme(page).catch((err: unknown) => {
    console.warn("[preview] computed theme failed:", err instanceof Error ? err.message : err);
    return null;
  });
  const bytes = await page
    .screenshot({ type: "jpeg", quality: 70, fullPage: false })
    .catch(() => null);

  return {
    screenshot: bytes ? `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}` : null,
    theme: raw ? toTheme(raw) : {},
  };
}

function toTheme(raw: RawComputed): BrowserTheme {
  const theme: BrowserTheme = {};

  /* A transparent <body> is not "unknown": it means the browser painted its own
     canvas, which is white, and white is what the screenshot shows. Recording it
     keeps the theme honest and lets the caller treat this read as usable. */
  theme.background =
    parseColour(raw.bodyBackground) ?? parseColour(raw.documentBackground) ?? "#ffffff";

  const text = parseColour(raw.text);
  if (text) theme.text = text;

  /* Which button is the brand's? Taking the first one on the page picked a white
     nav pill over HexClad's red CTA. Score instead:
       · saturation, weighted double — a brand colour is a colour, and this is
         the only signal that separates a CTA from the greyscale furniture;
       · a flat point for standing off the page background at all (≥ 3:1), so a
         white-on-white ghost button cannot win on size alone;
       · a little for area, capped, because the big button is usually the one
         they want you to press.
     Strict `>` keeps document order on a tie, which is the right tiebreak: the
     higher button is the more prominent one. */
  let winner: ButtonCandidate | null = null;
  let bestScore = -1;
  for (const candidate of raw.buttons) {
    const background = parseColour(candidate.background);
    if (!background) continue;
    const score =
      2 * saturation(background) +
      (contrastRatio(background, theme.background) >= 3 ? 1 : 0) +
      Math.min(candidate.area / 40_000, 1) * 0.5;
    if (score > bestScore) {
      bestScore = score;
      winner = candidate;
    }
  }

  /* A button the same colour as the page is a ghost button or something we
     mis-picked, never the brand's call to action. Try the link colour next, and
     if that is no better say nothing at all — the stylesheet pass runs whenever
     the accent is missing and will usually do better than a guess. */
  let accent: string | null = null;
  let fromButton = false;
  for (const [candidate, isButton] of [
    [winner ? parseColour(winner.background) : null, true],
    [parseColour(raw.link), false],
  ] as const) {
    if (candidate && contrastRatio(candidate, theme.background) >= 1.5) {
      accent = candidate;
      fromButton = isButton;
      break;
    }
  }
  if (accent) theme.accent = accent;

  const accentText = winner ? parseColour(winner.color) : null;
  if (accentText && fromButton) theme.accentText = accentText;

  const radius = Number.parseFloat(winner?.radius ?? "");
  if (Number.isFinite(radius)) theme.radius = radius;

  const font = raw.font?.trim();
  if (font) theme.fontFamily = font;

  return theme;
}

/**
 * A graceful close talks to a browser that may be exactly the thing that hung,
 * so it gets three seconds and then the signal. Leaking a Chrome per preview is
 * not an option on a long-lived server.
 */
async function shutdown(browser: Browser): Promise<void> {
  try {
    await withDeadline(browser.close(), 3_000, "browser close");
  } catch {
    browser.process()?.kill("SIGKILL");
  }
}

export async function captureSite(url: string): Promise<CaptureResult | null> {
  const executable = await executablePath();
  if (!executable) return null;

  let browser: Browser | null = null;
  try {
    /* Deliberately one browser per job. Reusing a warm instance saves ~400ms but
       a single wedged page then poisons every later preview, and this route runs
       at most a handful of times a minute. */
    browser = await launch(executable);
    return await withDeadline(capture(browser, url), TOTAL_BUDGET_MS, "screenshot stage");
  } finally {
    if (browser) await shutdown(browser);
  }
}
