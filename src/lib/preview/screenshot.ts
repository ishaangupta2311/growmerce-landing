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
 *
 * The same browser takes a second picture: the store's own search answering
 * our query. That one is driven the way a shopper would drive it — find the
 * box, type, press Enter, go where the store goes — and it is a photograph or
 * nothing. See `captureSearch` for why nothing is a perfectly good answer.
 */

import { existsSync } from "node:fs";

import puppeteer, {
  type Browser,
  type HTTPRequest,
  type HTTPResponse,
  type Page,
} from "puppeteer-core";

import { withDeadline } from "./deadline";
import { assertPublicHost, isSyntacticallyPublicHost } from "./store-url";
import { contrastRatio, parseColour, saturation } from "./theme";
import type { NativeSearch, PreviewTheme } from "./types";

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };
/** Whole stage, launch and both pages included. Past this the visitor is just staring at a spinner. */
const TOTAL_BUDGET_MS = 28_000;
const NAV_TIMEOUT_MS = 12_000;
const NETWORK_IDLE_MS = 4_000;
const MODAL_BUDGET_MS = 300;

/* The search page loads the storefront a second time, then a results page on
   top. Below this there is not enough left to do both, and starting is worse
   than skipping: a half-run leaves a page mid-navigation for the deadline to
   kill, and the homepage shot we already have is the one worth returning. */
const SEARCH_MIN_BUDGET_MS = 7_000;
/* Second load of the same origin, so the cache is warm and this can be shorter. */
const SEARCH_NAV_TIMEOUT_MS = 10_000;
/* How long a store gets to answer Enter with a navigation before we conclude
   it rendered results in place instead. SearchTap and Algolia both do that. */
const SUBMIT_WAIT_MS = 4_000;
/* A drawer or modal sliding open. Longer than any theme's transition. */
const DRAWER_SETTLE_MS = 700;
/* How long a results page that went quiet before it drew anything gets to
   finish. SearchTap sits on a spinner well past network idle when the query is
   a sentence rather than a keyword — boat-lifestyle.com timed out here at 8 s
   and returned no panel at all, and sugarcosmetics.com (same engine) needed
   9 s for the whole stage.
   That failure is the expensive direction. A store whose search cannot answer
   a sentence is precisely the store worth showing the merchant: sugarcosmetics
   answered with "No results found for ... showing 326 result(s) for "gift"
   instead", which is the argument for the product, made by their own
   storefront. Timing out one second early turns that into a blank panel and we
   lose the sale we were making. The stage has 28 s and observed full-pipeline
   runs finish in 19.6–24.4 s of 45 s, so the ceiling is affordable; Walmart's
   forever-skeleton still costs exactly one wait. */
const ANSWER_WAIT_MS = 15_000;
/* Header icons we will click before giving up on finding a search box. */
const TOGGLE_ATTEMPTS = 3;

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
  /** Their search answering our query, or null — never a substitute. */
  nativeSearch: NativeSearch | null;
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

/* The *promise*, not the path. Caching only the finished answer let two cold
   requests both miss the cache and both enter `@sparticuz/chromium`, which
   unpacks a ~100 MB binary into /tmp — so the second one could hand back a path
   to a half-written executable and exec it. Storing the in-flight promise makes
   the extraction happen once and everyone wait for the same one. */
let resolvedExecutable: Promise<string | null> | null = null;

/**
 * `CHROME_PATH` wins, then a real browser on this machine, then the serverless
 * bundle. The last one unpacks on first use, which is fine on Lambda and a waste
 * on a laptop that already has Chrome — hence the order.
 */
function executablePath(): Promise<string | null> {
  resolvedExecutable ??= (async () => {
    const fromEnv = process.env.CHROME_PATH?.trim();
    if (fromEnv && existsSync(fromEnv)) return fromEnv;

    const local = (process.platform === "darwin" ? MAC_CANDIDATES : LINUX_CANDIDATES).find((path) =>
      existsSync(path),
    );
    if (local) return local;

    /* Serverless. This is the branch that runs in production and the one we
       cannot watch, so it says which path it took either way — a preview that
       silently degrades to "stylesheet colours, no screenshot" on every store
       looks identical to a store that blocked us, and the two need completely
       different fixes. `@sparticuz/chromium` reads its ~100 MB binary out of
       .br files in its own bin/ by computed path, which is exactly the shape
       of dependency a static file tracer can miss, so "the package imported
       but the binary is not on disk" is a real and otherwise invisible
       outcome. */
    try {
      const { default: chromium } = await import("@sparticuz/chromium");
      const path = await chromium.executablePath();
      if (!path || !existsSync(path)) {
        console.warn(
          `[preview] @sparticuz/chromium resolved to ${path ?? "nothing"}, which is not on disk — ` +
            "the browser binary was not deployed with the function.",
        );
        return null;
      }
      console.info(`[preview] using the serverless Chromium at ${path}`);
      return path;
    } catch (err) {
      console.warn(
        "[preview] no Chrome available:",
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  })();
  return resolvedExecutable;
}

/**
 * At most two Chromes at once, process-wide.
 *
 * This is the real ceiling on what a burst of requests can cost us: the per-IP
 * budget in the route is trivially spread across addresses, but nothing gets
 * past this. A caller that cannot get a slot inside its own budget goes without
 * a screenshot, which is a stage this pipeline is built to lose.
 */
const MAX_CONCURRENT_BROWSERS = 2;
let running = 0;
const waiting: (() => void)[] = [];

async function acquireSlot(budgetMs: number): Promise<boolean> {
  if (running < MAX_CONCURRENT_BROWSERS) {
    running += 1;
    return true;
  }

  let release: (() => void) | null = null;
  const queued = new Promise<boolean>((resolve) => {
    release = () => resolve(true);
    waiting.push(release);
  });

  const won = await Promise.race([
    queued,
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), Math.max(0, budgetMs)).unref?.();
    }),
  ]);

  if (won) {
    running += 1;
    return true;
  }
  /* Timed out waiting. Drop our place in the queue so a later release is not
     handed to a caller that has already given up. */
  const index = release ? waiting.indexOf(release) : -1;
  if (index >= 0) waiting.splice(index, 1);
  return false;
}

function releaseSlot(): void {
  running = Math.max(0, running - 1);
  waiting.shift()?.();
}

async function launch(executable: string, budgetMs: number): Promise<Browser> {
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
    /* Both of these default to 30 s, which is longer than the whole stage is
       allowed to take. The comment above `TOTAL_BUDGET_MS` used to claim the
       launch was covered; it was not. */
    timeout: budgetMs,
    protocolTimeout: budgetMs,
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
const HOST_VERDICT_DEADLINE_MS = 2_000;

/** Per-request-hostname DNS verdicts, scoped to one capture. */
type HostVerdicts = Map<string, Promise<boolean>>;

/**
 * Deliberately created per `capture()` and thrown away with it.
 *
 * A process-wide cache with a TTL turned DNS rebinding from a race into a
 * schedule: job one resolves `r.evil.com` to a public address and caches the
 * verdict, the attacker flips the record, and job two inside the window does no
 * lookup at all. Scoped to a single job, the worst an attacker gets is the race
 * they always had.
 */
function hostAllowed(hostname: string, verdicts: HostVerdicts): Promise<boolean> {
  const cached = verdicts.get(hostname);
  if (cached) return cached;

  const allowed = withDeadline(
    assertPublicHost(hostname, HOST_VERDICT_DEADLINE_MS),
    HOST_VERDICT_DEADLINE_MS,
    `dns ${hostname}`,
  ).then(
    () => true,
    () => false,
  );
  verdicts.set(hostname, allowed);

  if (verdicts.size > 200) {
    const oldest = verdicts.keys().next();
    if (!oldest.done) verdicts.delete(oldest.value);
  }
  return allowed;
}

/**
 * The SSRF guard, again, from the other side.
 *
 * `safeFetch` only covers the HTML we pulled ourselves. The browser then goes
 * off and does its own thing: it follows the store's redirects, loads
 * subresources from wherever the markup points, and renders iframes — all of
 * which are requests our process makes to hosts we never chose, from inside our
 * network.
 *
 * Every intercepted request therefore gets the full check — name, port and DNS —
 * regardless of resource type. An earlier version checked DNS on documents only
 * and called subresource access "blind"; it is not. A hostile page can fire
 * hundreds of `fetch()`es at `10.0.0.5.nip.io:6443` and friends during the load
 * window, read the outcomes from JavaScript, and paint them into
 * `body.style.background` — where `readComputedTheme` and the JPEG hand them
 * straight back to the caller. Ports are checked for the same reason: the
 * interesting internal services do not listen on 80.
 *
 * What is still open, honestly: between our lookup and Chrome's own connection
 * the name can change answers, and nothing here can see that. Closing it needs
 * the browser pointed at a forward proxy that pins each hostname to the address
 * we validated. That is the right fix and it is not built.
 */
async function handleRequest(
  request: HTTPRequest,
  page: Page,
  loaded: () => boolean,
  verdicts: HostVerdicts,
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
  if (target.port && target.port !== "80" && target.port !== "443") {
    abort();
    return;
  }
  if (!isSyntacticallyPublicHost(target.hostname)) {
    abort();
    return;
  }
  if (!(await hostAllowed(target.hostname, verdicts))) {
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

type GuardedPage = {
  page: Page;
  /**
   * Flip the navigation guard in `handleRequest`: from here on nothing may
   * move the main frame. Called once the page we mean to photograph is up.
   */
  lock: () => void;
  /** Status of the last main-frame document, so a 403/404 is never mistaken for a page. */
  documentStatus: () => number | null;
  /**
   * Main-frame documents served so far. Comparing before and after is the one
   * reliable way to know a real navigation happened: `waitForNavigation` is on
   * a timer and a store that draws suggestions first and navigates second can
   * outlast it, and a URL change alone is also what pushState looks like.
   */
  documents: () => number;
};

/**
 * Every page this stage opens goes through here, so the second one cannot
 * quietly miss the SSRF guard the first one has. The search page in particular
 * follows a merchant-controlled form action to wherever it points.
 */
async function openPage(browser: Browser): Promise<GuardedPage> {
  const page = await browser.newPage();
  const verdicts: HostVerdicts = new Map();
  let locked = false;
  let status: number | null = null;
  let documents = 0;
  await page.setRequestInterception(true);
  page.on("request", (request) => void handleRequest(request, page, () => locked, verdicts));
  page.on("response", (response: HTTPResponse) => {
    const request = response.request();
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      status = response.status();
      documents += 1;
    }
  });
  await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });
  return {
    page,
    lock: () => {
      locked = true;
    },
    documentStatus: () => status,
    documents: () => documents,
  };
}

async function capture(
  browser: Browser,
  url: string,
  budgetMs: number,
): Promise<Omit<CaptureResult, "nativeSearch">> {
  const { page, lock } = await openPage(browser);

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: Math.min(NAV_TIMEOUT_MS, budgetMs),
  });
  lock();
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Boxes a shopper would type into, cast wide. The `i` flag on the attribute
 * matches is doing real work: `placeholder="Search"` and `placeholder="search
 * our store..."` are the same box. `name="s"` is WordPress/WooCommerce.
 */
const SEARCH_INPUT_SELECTOR =
  'input[type="search"], [role="searchbox"], input[name="q"], input[name="s"],' +
  ' input[name="query"], input[name="keyword"], input[name="keywords"], input[name="term"],' +
  ' input[name*="search" i], input[id*="search" i], input[class*="search" i],' +
  ' input[placeholder*="search" i], input[aria-label*="search" i],' +
  ' form[role="search"] input, form[action*="search" i] input';

/**
 * Things a shopper clicks to make the box appear: the magnifier in the header,
 * "Search" in the nav, Dawn's `<summary>`, the read-only pseudo-input some
 * themes draw where the real one opens in a modal.
 */
const SEARCH_TOGGLE_SELECTOR =
  'button, [role="button"], a[href], summary, label, input[readonly], [tabindex]';

/**
 * Bot walls, phrase by phrase. Any of these in the title or the opening text
 * and the page in front of us is not the store's search — it is the store's
 * edge telling us to go away — and a screenshot of it would put "Your
 * connection needs to be verified" under a merchant's own domain, which is
 * what boAt served on a rapid repeat. Spelt out rather than matching `captcha`
 * because a Shopify footer's "protected by reCAPTCHA" is on every honest
 * results page.
 */
const CHALLENGE_TEXT =
  /just a moment|checking your browser|checking if the site connection is secure|(?:verify|verifying|confirm|prove) (?:that )?you(?:'re| are) (?:not a robot|(?:a )?human)|robot or human|your connection needs to be verified|attention required|access denied|enable javascript and cookies to continue|are you a robot|press (?:and|&) hold|request unsuccessful|ddos-guard|bot verification|human verification|robot check|pardon our interruption|unusual traffic/i;

/** The title of a 404 or a 5xx page. Empty results are titled "Search", not "Not found". */
const ERROR_TITLE =
  /\b404\b|page not found|not found|does not exist|doesn'?t exist|something went wrong|server error|service unavailable|temporarily unavailable/i;

/**
 * The body of an error page that kept a normal title. Foot Locker answers a
 * headless search with its full header, footer and "We're sorry, we can't find
 * that page." under a 200 — a picture of that is not their search. Every
 * phrase here is about a *page*; "we couldn't find anything for …" is an honest
 * empty result and must never match.
 */
const ERROR_TEXT =
  /(?:can'?t|cannot|couldn'?t|could not|unable to) find (?:that|this|the) page|page (?:you(?:'re| are) looking for|you requested|you were looking for)|(?:this |that |the )?page (?:doesn'?t|does not|no longer) exist|page not found|internal server error|service unavailable|temporarily unavailable/i;

/**
 * Tag the search box a shopper would use, if one is on screen right now.
 * The element itself is marked rather than returned: nothing but JSON crosses
 * `evaluate`, so Node takes a handle to the mark afterwards.
 */
function findSearchInput(page: Page): Promise<boolean> {
  /* Same rule as readComputedTheme: no named functions inside the page. */
  return page.evaluate((selector) => {
    const MARK = "data-growsearch-target";
    for (const el of Array.from(document.querySelectorAll(`[${MARK}]`))) el.removeAttribute(MARK);

    let best: Element | null = null;
    let bestRank = Number.POSITIVE_INFINITY;
    for (const el of Array.from(document.querySelectorAll(selector)).slice(0, 200)) {
      if (el instanceof HTMLInputElement) {
        const type = (el.type || "text").toLowerCase();
        if (type !== "text" && type !== "search") continue;
        /* A read-only box is a picture of a search box: the real one opens on
           click. It is a toggle, and the toggle pass gets it. */
        if (el.disabled || el.readOnly) continue;
      } else if (!(el instanceof HTMLElement) || !el.isContentEditable) {
        continue;
      }

      const box = el.getBoundingClientRect();
      if (box.width < 30 || box.height < 10) continue;
      if (box.bottom <= 0 || box.top >= innerHeight || box.right <= 0 || box.left >= innerWidth) {
        continue;
      }
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || Number(style.opacity) <= 0.1) continue;

      /* The one a click would actually land on outranks the one under
         something; then the higher one, so a header box beats a footer one.
         The parent is allowed as the hit because plenty of themes float the
         magnifier icon over the input's own centre. */
      const hit = document.elementFromPoint(
        Math.min(Math.max(box.left + box.width / 2, 0), innerWidth - 1),
        Math.min(Math.max(box.top + box.height / 2, 0), innerHeight - 1),
      );
      const reachable =
        hit === el ||
        (hit !== null && (el.contains(hit) || el.parentElement?.contains(hit) === true));
      const rank = (reachable ? 0 : 10_000) + Math.max(0, box.top);
      if (rank < bestRank) {
        bestRank = rank;
        best = el;
      }
    }

    if (!best) return false;
    (best as Element).setAttribute(MARK, "");
    return true;
  }, SEARCH_INPUT_SELECTOR);
}

/**
 * Click the likeliest "open search" control not yet tried. An in-page click,
 * not a mouse event: a magnifier tucked under a sticky promo bar is still the
 * control the shopper uses, and `elementFromPoint` would hand us the bar.
 * Anchors navigate exactly as they would for a shopper — if the theme's script
 * prevents that and opens a drawer, we get the drawer; if not, the search page.
 */
function openSearchToggle(page: Page): Promise<boolean> {
  return page.evaluate((selector) => {
    const TRIED = "data-growsearch-tried";
    const SEARCH = /search/i;
    /* "Close search", "Clear search" and a "Research" nav item all match the
       word and none of them opens anything. */
    const NOT_A_TOGGLE = /close|cancel|clear|reset|research/i;

    let best: HTMLElement | null = null;
    let bestRank = Number.POSITIVE_INFINITY;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector)).slice(0, 600)) {
      if (el.hasAttribute(TRIED)) continue;
      const text = (el.textContent ?? "").trim();
      if (text.length > 60) continue;
      const label = `${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("title") ?? ""} ${text}`;
      const naming =
        `${el.id} ${el.getAttribute("class") ?? ""} ${el.getAttribute("href") ?? ""}` +
        ` ${el.getAttribute("aria-controls") ?? ""} ${el.getAttribute("name") ?? ""}` +
        ` ${el.getAttribute("placeholder") ?? ""}`;
      const labelled = SEARCH.test(label);
      if (!labelled && !SEARCH.test(naming)) continue;
      if (NOT_A_TOGGLE.test(label)) continue;

      const box = el.getBoundingClientRect();
      if (box.width < 12 || box.height < 12) continue;
      if (box.bottom <= 0 || box.top >= innerHeight || box.right <= 0 || box.left >= innerWidth) {
        continue;
      }
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || Number(style.opacity) <= 0.1) continue;

      /* A button that says "Search" beats a link that says it, beats anything
         that only has it in a class name; nearer the top beats lower down. */
      const rank =
        (el instanceof HTMLAnchorElement ? 100 : 0) +
        (labelled ? 0 : 50) +
        Math.max(0, box.top) / 10;
      if (rank < bestRank) {
        bestRank = rank;
        best = el;
      }
    }

    if (!best) return false;
    (best as HTMLElement).setAttribute(TRIED, "");
    (best as HTMLElement).click();
    return true;
  }, SEARCH_TOGGLE_SELECTOR);
}

/** Enough of the page to tell "something happened" from "nothing did". */
type Fingerprint = { url: string; text: number; nodes: number };

function fingerprint(page: Page): Promise<Fingerprint> {
  return page.evaluate(() => ({
    url: location.href,
    text: document.body ? document.body.innerText.length : 0,
    nodes: document.getElementsByTagName("*").length,
  }));
}

/* Thresholds sit above what a rotating hero or a ticking promo bar moves and
   well below what a results grid — or an honest "0 results for …" — adds. */
function changed(before: Fingerprint, after: Fingerprint): boolean {
  return (
    before.url !== after.url ||
    Math.abs(before.text - after.text) >= 80 ||
    Math.abs(before.nodes - after.nodes) >= 15
  );
}

/**
 * Whether a navigated page is showing an answer at all. Every results page
 * we have met says one of two things outside the search box: the word
 * "result" — "Showing 322 Result(s)", "We found 2 results", "No results
 * found" — or the query itself, echoed back. (`innerText` skips input values,
 * so the query still sitting in the box does not count.)
 *
 * Walmart's search says neither. It is a skeleton — grey bars where the grid
 * will go — until an API call PerimeterX never lets a headless browser
 * complete, so the network goes quiet with the placeholders still up and
 * enough header text to pass any "is there content" test. A picture of that
 * is not their search any more than a bot wall is.
 */
function showsAnswer(page: Page, query: string): Promise<boolean> {
  const needle = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 3).join(" ");
  return page.evaluate((echo) => {
    const text = (document.body ? document.body.innerText : "").replace(/\s+/g, " ").toLowerCase();
    return /\bresults?\b/.test(text) || (echo.length > 0 && text.includes(echo));
  }, needle);
}

/** Why the page in front of us is not the store's search, or null if it is. */
async function refusal(guarded: GuardedPage): Promise<"challenge" | "error" | null> {
  /* Same reasoning as fetch-site.ts: a 403 is the edge turning us away and a
     404 is not a results page, whatever either of them looks like. */
  const status = guarded.documentStatus();
  const { title, text } = await guarded.page.evaluate(() => ({
    title: document.title,
    text: document.body ? document.body.innerText.slice(0, 800) : "",
  }));
  if (CHALLENGE_TEXT.test(`${title}\n${text}`)) return "challenge";
  if (status !== null && status >= 400) {
    return status === 401 || status === 403 || status === 429 ? "challenge" : "error";
  }
  if (ERROR_TITLE.test(title) || ERROR_TEXT.test(text)) return "error";
  return null;
}

/**
 * Fire the submit and wait for the store to do whatever it does with a query:
 * navigate to a results page (Shopify's /search, WooCommerce's /?s=), or draw
 * results into the page it is on (SearchTap, Algolia, most predictive-search
 * apps). Both are what the shopper sees. The only failure is nothing at all,
 * and that is the caller's call, from the fingerprint and the document count.
 */
async function awaitSearchResponse(
  page: Page,
  before: Fingerprint,
  left: () => number,
  trigger: () => Promise<void>,
): Promise<void> {
  let done = false;
  const navigation = page
    .waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: Math.min(SUBMIT_WAIT_MS, left()),
    })
    .then(
      () => {},
      () => {},
    );

  await trigger();

  /* Poll for an in-place render so a store that never navigates does not cost
     the whole navigation timeout. The poll throws while a navigation is
     committing — the context it is asking is being torn down — and that is
     just "not yet". */
  const rendered = (async () => {
    const until = Date.now() + Math.min(SUBMIT_WAIT_MS, left());
    while (!done && Date.now() < until) {
      await sleep(300);
      const now = await fingerprint(page).catch(() => null);
      if (now && changed(before, now)) return;
    }
  })();

  await Promise.race([navigation, rendered]);
  done = true;
  /* Results arrive by XHR in the in-place case and as subresources in the
     other; either way the grid is not on screen until the network goes quiet. */
  await page
    .waitForNetworkIdle({ idleTime: 500, timeout: Math.min(NETWORK_IDLE_MS, left()) })
    .catch(() => {});
}

type SearchAttempt = { search: NativeSearch | null; outcome: string };

/**
 * The store's own search, answering our query, photographed.
 *
 * Driven the way a shopper drives it: load the storefront, find the box or the
 * icon that reveals it, type, press Enter, and screenshot wherever that leads.
 * Nothing is fetched from a guessed endpoint and nothing is redrawn — the
 * previous version quoted /search/suggest.json, which boAt's shoppers never
 * touch, and drew its six-hits-for-anything answer as tidy cards.
 *
 * Every exit but the last returns null, and null is a good answer. It means
 * the UI shows nothing, which is always better than showing the merchant a
 * bot wall, an error page, or a picture of the homepage with a query typed
 * into it, and calling any of those their search.
 */
async function captureSearch(
  browser: Browser,
  url: string,
  query: string,
  budgetMs: number,
): Promise<SearchAttempt> {
  const endsAt = Date.now() + budgetMs;
  const left = () => Math.max(0, endsAt - Date.now());
  const guarded = await openPage(browser);
  const { page, lock } = guarded;
  const none = (outcome: string): SearchAttempt => ({ search: null, outcome });

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: Math.min(SEARCH_NAV_TIMEOUT_MS, left()),
    });
  } catch {
    return none("load-failed");
  }
  await page
    .waitForNetworkIdle({ idleTime: 500, timeout: Math.min(NETWORK_IDLE_MS, left()) })
    .catch(() => {});
  /* A second load of the same origin inside a few seconds is exactly what
     tips a rate limiter, so this is checked here and not only at the end. */
  const walled = await refusal(guarded);
  if (walled) return none(walled);

  /* Deliberately no overlay dismissal before the search. Its last pass hides
     any pinned element named like a modal that has a big box, which on plenty
     of themes is the closed full-screen search modal — display:none'd, the
     toggle below would open nothing. Consent state was already accepted on
     the homepage page and lives in the shared context, so the banner is gone
     anyway; what is left is dealt with once the results page has landed. */
  let found = await findSearchInput(page).catch(() => false);
  for (let attempt = 0; !found && attempt < TOGGLE_ATTEMPTS && left() > 2_500; attempt += 1) {
    const clicked = await openSearchToggle(page).catch(() => false);
    if (!clicked) break;
    await sleep(DRAWER_SETTLE_MS);
    found = await findSearchInput(page).catch(() => false);
    if (!found) {
      /* An anchor toggle navigated, and the box we want is on the page that
         is still arriving. */
      await page
        .waitForNetworkIdle({ idleTime: 500, timeout: Math.min(NETWORK_IDLE_MS, left()) })
        .catch(() => {});
      found = await findSearchInput(page).catch(() => false);
    }
  }
  if (!found) return none("no-search-box");

  const input = await page.$("[data-growsearch-target]");
  if (!input) return none("no-search-box");
  if (left() < 2_500) return none("budget");

  /* Taken before typing, not before Enter: on a store whose Enter is a no-op
     because results already appeared as you typed, what appeared is the answer
     the shopper gets, and it must not read as "nothing happened". */
  const before = await fingerprint(page);
  const documentsBefore = guarded.documents();
  await input.evaluate((el) => {
    if (el instanceof HTMLInputElement) el.value = "";
  });
  await input.focus();
  await page.keyboard.type(query, { delay: 8 });

  await awaitSearchResponse(page, before, left, () => page.keyboard.press("Enter"));
  if (!changed(before, await fingerprint(page).catch(() => before))) {
    /* Some forms only listen to their own button. Press that, and if the page
       still does not move we are looking at the homepage with a query typed
       into it, which is not their search. */
    const pressed = await page
      .evaluate(() => {
        const box = document.querySelector<HTMLInputElement>("[data-growsearch-target]");
        const form = box?.form ?? box?.closest("form") ?? null;
        if (!form) return false;
        const button = form.querySelector<HTMLElement>('[type="submit"], button:not([type="button"])');
        if (button) button.click();
        else form.requestSubmit();
        return true;
      })
      .catch(() => false);
    if (!pressed) return none("no-response");
    await awaitSearchResponse(page, before, left, async () => {});
    if (!changed(before, await fingerprint(page).catch(() => before))) return none("no-response");
  }
  /* "Navigated" also covers a pushed URL whose path left the storefront's:
     SearchTap takes boAt from / to /pages/searchtap-search without ever
     loading a document, and what it draws there is a results page in every
     sense that matters below — it is in the document flow, and it says how
     many results. Measured against the URL we started from, not the one we
     typed into: Allbirds' search icon client-routes to /search first, so by
     typing time the path has already moved. A drawer that pushes only `?q=`
     onto the storefront's own path is left alone. */
  const navigated =
    guarded.documents() > documentsBefore ||
    new URL(page.url()).pathname !== new URL(url).pathname;

  lock();
  const refused = await refusal(guarded).catch(() => "error" as const);
  if (refused) return none(refused);

  /* Only a navigated page is judged on whether it answered. In-place results
     are a drawer over the storefront, which says "result" nowhere, and the
     fingerprint has already proved something appeared. */
  if (navigated) {
    /* Keep enough back to still take the shot when the answer does arrive. */
    const until = Date.now() + Math.min(ANSWER_WAIT_MS, left() - 1_500);
    let answered = await showsAnswer(page, query).catch(() => true);
    while (!answered && Date.now() < until) {
      await sleep(500);
      answered = await showsAnswer(page, query).catch(() => true);
    }
    if (!answered) return none("no-answer");
  }

  if (navigated) {
    await withDeadline(dismissOverlays(page), MODAL_BUDGET_MS, "overlay dismissal").catch(() => {});
    await sleep(300);
  }
  if (left() < 1_000) return none("budget");

  const bytes = await page
    .screenshot({ type: "jpeg", quality: 70, fullPage: false })
    .catch(() => null);
  if (!bytes) return none("screenshot-failed");

  return {
    search: {
      query,
      screenshot: `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`,
      url: page.url(),
      source: "storefront-search",
    },
    outcome: navigated ? "navigated" : "in-place",
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
  const child = browser.process();
  try {
    await withDeadline(browser.close(), 3_000, "browser close");
  } catch {
    child?.kill("SIGKILL");
  }

  /* `close()` resolving is not the process being gone, and the semaphore counts
     real browsers — without this wait a closing Chrome overlaps the next launch
     and three are briefly alive under a limit of two. */
  if (child && child.exitCode === null && child.signalCode === null) {
    await withDeadline(
      new Promise<void>((resolve) => child.once("exit", () => resolve())),
      1_000,
      "browser exit",
    ).catch(() => {});
  }

  /* Chrome's stdio pipes can outlive Chrome. Its helper processes inherit the
     write ends, and puppeteer keeps a referenced reader on stderr until the
     last of them lets go — which, measured on a smoke run against hexclad.com
     after a close that took 150 ms, was over three minutes, with the script
     sitting on nothing but pipe handles the whole time. Nothing useful arrives
     on them once the browser has gone, so let go of our end. */
  for (const stream of [child?.stdin, child?.stdout, child?.stderr]) stream?.destroy();
}

/** Strip query strings before a puppeteer error reaches the log: the URL it names carries our query. */
function terse(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).replace(/\?\S*/g, "").slice(0, 160);
}

export async function captureSite(
  url: string,
  query: string,
  budgetMs: number,
): Promise<CaptureResult | null> {
  const budget = Math.min(TOTAL_BUDGET_MS, budgetMs);
  if (budget < 3_000) return null; // not enough left to be worth a browser

  const executable = await executablePath();
  if (!executable) {
    /* Returning null here used to be the quietest failure in the pipeline: the
       stage logged ok=false with no reason, because nothing threw. It is also
       the likeliest one in production, where the browser is a binary that has
       to have been deployed rather than one that is simply installed. */
    console.warn("[preview] skipping capture — no usable browser on this machine");
    return null;
  }

  const startedAt = Date.now();
  /* Half the budget at most on queueing — arriving at the capture with no time
     left to run it is the same as never getting a slot. */
  if (!(await acquireSlot(budget / 2))) {
    console.info("[preview] stage=screenshot skipped=busy");
    return null;
  }

  let browser: Browser | null = null;
  try {
    const left = () => Math.max(1_000, budget - (Date.now() - startedAt));
    /* Deliberately one browser per job. Reusing a warm instance saves ~400ms but
       a single wedged page then poisons every later preview, and the semaphore
       above already caps what a burst can cost. */
    browser = await launch(executable, left());
    const homepage = await withDeadline(capture(browser, url, left()), left(), "screenshot stage");

    /* The search runs after the homepage, in a second page of the same
       browser, not alongside it. Two tabs loading one store at once — on top
       of the HTML and catalogue fetches already made — is the burst that got
       boAt's bot wall raised, and a wall costs both pictures, not one. */
    let nativeSearch: NativeSearch | null = null;
    if (left() < SEARCH_MIN_BUDGET_MS) {
      console.info("[preview] stage=native skipped=budget");
    } else {
      const searchStartedAt = Date.now();
      const attempt = await withDeadline(
        captureSearch(browser, url, query, left()),
        left(),
        "native search stage",
      ).catch((err: unknown): SearchAttempt => ({ search: null, outcome: `error: ${terse(err)}` }));
      nativeSearch = attempt.search;
      console.info(
        `[preview] stage=native outcome=${attempt.outcome} ms=${Date.now() - searchStartedAt}`,
      );
    }

    return { ...homepage, nativeSearch };
  } finally {
    if (browser) await shutdown(browser);
    releaseSlot();
  }
}
