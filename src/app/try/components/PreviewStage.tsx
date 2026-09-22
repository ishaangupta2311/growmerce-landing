"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Arrow from "@/components/site/Arrow";
import { OpenDemoStoreButton } from "@/components/site/OpenDemoStore";
import InstallOnShopify from "@/components/site/InstallOnShopify";
import { DEMO_STORE_PASSWORD, SHOPIFY_LISTING_LIVE } from "@/lib/site-urls";
import {
  DEFAULT_THEME,
  type PreviewErrorCode,
  type PreviewResponse,
  type PreviewResult,
  type PreviewTheme,
} from "@/lib/preview/types";
import { isAbort, timeoutSignal } from "./net";
import StoreFrame from "./StoreFrame";
import GrowsearchWidget from "./GrowsearchWidget";
import NativeSearchPanel from "./NativeSearchPanel";
import { FIXTURES, isFixtureKey, type FixtureKey } from "./fixture";

/* Chrome-bar heights for the two canvases; the canvas boxes themselves are
   `.gs-canvas--wide` / `--compact` in globals.css. */
const DESKTOP_CANVAS = { chrome: 44 };
const COMPACT_CANVAS = { chrome: 36 };

const STEPS = [
  "Reaching your store",
  "Reading the theme",
  "Taking a screenshot",
  "Drawing Growsearch on it",
];

const THEME_SOURCE_LINE: Record<PreviewResult["themeSource"], string> = {
  computed: "Colours matched from your live styles.",
  stylesheet: "Colours matched from your stylesheet.",
  default: "We used default colours — we couldn't read yours.",
};

/* The API's own `message` carries the detail; this is only the headline, and
   "we couldn't reach your store" is the wrong headline for a rate limit or a
   crash on our side. */
function errorTitle(code: PreviewErrorCode | null, store: string): string {
  switch (code) {
    case "invalid_store":
      return "That domain didn't look right";
    case "rate_limited":
      return "We've run a lot of these just now";
    case "internal":
      return "That one broke on our side";
    case "timeout":
      return "That took longer than we could wait";
    case "refused":
      return `${store} wouldn't let us in`;
    default:
      return `We couldn't reach ${store}`;
  }
}

/**
 * The part of the capture URL worth printing: host and path, no query string.
 *
 * The capture is taken on whatever page the search control was opened on —
 * the homepage, or a collection if that is where we landed — and the path is
 * the part that says which. A query string on that page is UTM and variant
 * noise, not provenance, and an earlier version that printed the whole URL
 * pushed the caption a line past its reserved height. Null when the URL will
 * not parse or is not a web URL: the job follows a merchant-controlled
 * redirect to get here, and the caption links to it, so anything but http(s)
 * is dropped rather than rendered.
 */
function captureLocation(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return `${u.host}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return null;
  }
}

type State =
  | { status: "loading" }
  | { status: "ready"; result: PreviewResult }
  /** `code` is null when we never had a token to send in the first place. */
  | { status: "error"; code: PreviewErrorCode | null; message: string };

function themeVars(theme: PreviewTheme): CSSProperties {
  /* Every colour the widget and the frame use comes through these, so the
     same markup can wear any store. Cast because CSS custom properties are
     not part of React's CSSProperties. */
  return {
    "--gs-bg": theme.background,
    "--gs-surface": theme.surface,
    "--gs-text": theme.text,
    "--gs-muted": theme.muted,
    "--gs-accent": theme.accent,
    "--gs-accent-text": theme.accentText,
    "--gs-border": theme.border,
    "--gs-radius": `${theme.radius}px`,
    "--gs-font": theme.fontFamily
      ? `${theme.fontFamily}, ui-sans-serif, system-ui, sans-serif`
      : "ui-sans-serif, system-ui, sans-serif",
    fontFamily: "var(--gs-font)",
  } as CSSProperties;
}

/** What we render when the job could not tell us anything about the store. */
function fallbackResult(store: string): PreviewResult {
  return {
    store,
    url: `https://${store}/`,
    title: null,
    platform: "other",
    logo: null,
    favicon: null,
    screenshot: null,
    theme: DEFAULT_THEME,
    themeSource: "default",
    products: [],
    query: "something warm for the rainy commute",
    /* We never reached the store, so we never opened its search. Null is the
       only honest value, and with it there is no before state and no toggle. */
    nativeSearch: null,
    // Never shown; a constant keeps this render deterministic.
    fetchedAt: "1970-01-01T00:00:00.000Z",
  };
}

/**
 * Draws the fixed-size composition at whatever width the column gives it.
 *
 * Both canvases are rendered and a container query shows one — the phone
 * layout is different markup, not the desktop one shrunk, and picking between
 * them in CSS keeps the stage correct on the first paint. See `.gs-stage` in
 * globals.css for the scaling.
 */
function Canvas({
  result,
  compact,
  withGrowsearch,
}: {
  result: PreviewResult;
  compact: boolean;
  withGrowsearch: boolean;
}) {
  /* The query belongs to the Growsearch half only. The before panel never
     sees it: we do not type into the merchant's search, because we cannot
     pick a phrase that is fair to an arbitrary catalogue — a vague one made
     their search look perfectly adequate on some stores and argued against
     us — so the before half is their search box empty, and nothing here may
     imply otherwise. */
  const query = result.query;

  return (
    <div className={compact ? "gs-canvas gs-canvas--compact" : "gs-canvas gs-canvas--wide"}>
      <div className="gs-inner">
        <StoreFrame
          result={result}
          compact={compact}
          chromeHeight={compact ? COMPACT_CANVAS.chrome : DESKTOP_CANVAS.chrome}
          dimmed={withGrowsearch}
        />

        {/* The store's own search, shown only when we actually photographed
            it. A null `nativeSearch` means we could not open one — no browser,
            or no search control we could find — and then nothing is drawn
            here at all; Stage also drops the toggle, so this state is never
            on show. Hidden from readers while it is faded out: opacity 0
            leaves an image in the accessibility tree, and its alt would be
            announced over a stage that is visibly showing something else. */}
        {result.nativeSearch ? (
          <div
            className="gs-fade pointer-events-none absolute inset-0"
            style={{ opacity: withGrowsearch ? 0 : 1 }}
            aria-hidden={withGrowsearch}
          >
            <NativeSearchPanel
              search={result.nativeSearch}
              store={result.store}
              compact={compact}
              chromeHeight={compact ? COMPACT_CANVAS.chrome : DESKTOP_CANVAS.chrome}
            />
          </div>
        ) : null}

        {/* The widget fades on a wrapper rather than on itself: its entrance
            animation owns its own opacity with `both` fill, so an inline
            opacity on the same element would lose to it and the thing could
            never fade back out. Both layers are absolutely positioned, so
            neither state contributes height and the frame cannot move. */}
        <div
          className="gs-fade pointer-events-none absolute inset-0"
          style={{ opacity: withGrowsearch ? 1 : 0 }}
        >
          <GrowsearchWidget
            products={result.products}
            storeTitle={result.title}
            query={query}
            compact={compact}
          />
        </div>
      </div>
    </div>
  );
}

const MODES = [
  { id: "before", label: "Your store today" },
  { id: "after", label: "With Growsearch" },
] as const;

/**
 * Two states over one frame.
 *
 * "Before" is a screenshot of their own search box, opened and left empty —
 * undimmed, no Growsearch chrome — because the whole value of a comparison is
 * that one side of it is the truth. "After" is the scrim and the widget. Only
 * opacity changes between them, so the frame is pinned: nothing reflows,
 * nothing resizes, and the page does not jump.
 *
 * Where we could not photograph their search there is no "before" and no
 * toggle. An earlier version kept the control and showed the untouched
 * homepage under "Your store today", which compares nothing — the visitor
 * asked about search, and a tab that answers with a homepage reads as either a
 * bug or something being hidden. With one state there is nothing to switch,
 * so the stage simply is the Growsearch mock-up.
 *
 * It opens on "after". That is the answer they came for, and the widget's
 * entrance animation already reads as it landing on their storefront; the
 * control is there for the second look.
 */
function Stage({
  result,
  /** True when we are drawing a stand-in because the job could not read them. */
  synthesised = false,
}: {
  result: PreviewResult;
  synthesised?: boolean;
}) {
  const [wantsGrowsearch, setWantsGrowsearch] = useState(true);
  const groupId = useId();

  /* Derived, not just state: a result with nothing to compare against can
     never be shown in the before state, whatever the button was last set to. */
  const comparable = result.nativeSearch !== null;
  const withGrowsearch = comparable ? wantsGrowsearch : true;

  return (
    <div>
      {comparable ? (
        <div
          role="group"
          aria-labelledby={groupId}
          className="mb-4 inline-flex rounded-full border border-line bg-cream p-1"
        >
          <span id={groupId} className="sr-only">
            Compare your store&apos;s own search with Growsearch
          </span>
          {MODES.map((mode) => {
            const active = (mode.id === "after") === withGrowsearch;
            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={active}
                onClick={() => setWantsGrowsearch(mode.id === "after")}
                className={`font-poppins rounded-full px-4 py-2 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-5 sm:text-[14px] ${
                  active
                    ? "bg-brand text-white"
                    : "text-body-mute hover:text-charcoal"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="gs-stage w-full" style={themeVars(result.theme)}>
        <Canvas result={result} compact={false} withGrowsearch={withGrowsearch} />
        <Canvas result={result} compact withGrowsearch={withGrowsearch} />
      </div>

      {/* Live, so switching is announced rather than only visible. The height
          is reserved to the taller of the two captions — measured, not
          guessed — because they are different lengths and the page must not
          move under the control that changed it. On the light fixture the
          before caption is 118px at 390px wide and 52px at 1440; the after
          caption is 96px and 52px. */}
      <p
        aria-live="polite"
        className="mt-5 min-h-[7.5rem] text-[14.5px] leading-relaxed text-body-mute sm:min-h-[3.25rem]"
      >
        <StageCaption
          result={result}
          withGrowsearch={withGrowsearch}
          synthesised={synthesised}
        />
      </p>
    </div>
  );
}

function StageCaption({
  result,
  withGrowsearch,
  synthesised,
}: {
  result: PreviewResult;
  withGrowsearch: boolean;
  synthesised: boolean;
}) {
  /* "Mock-up" is the right word for the after state and the wrong one for the
     before state, where what is on screen is a photograph of their own search.
     The before caption only exists when there is a photograph — Stage never
     shows the before state without one — so a null here falls through to the
     after copy rather than inventing a third thing to say. */
  const native = withGrowsearch ? null : result.nativeSearch;

  if (native) {
    const capturedAt = captureLocation(native.url);

    /* Provenance first: this is only worth showing because we really opened
       their search, and saying how is what makes it credible. The old caption
       said "these are its results" over cards we had drawn ourselves; this
       one can say "screenshot" because it is one, and it says "nothing typed"
       because an empty box makes no claim and the copy must not make one for
       it — `result.query` is deliberately absent here. The argument is look
       and feel: a box that waits for a keyword against an assistant that
       takes a sentence, so the second line points at the other state rather
       than passing judgement on this one. The address is the only place the
       host is printed: leading with it as well pushed the caption a line past
       its reserved height on both canvases. */
    return (
      <>
        <span className="font-semibold text-charcoal">
          Your own search, as a shopper first meets it.
        </span>{" "}
        We opened it and took a screenshot &mdash; nothing typed, nothing
        redrawn. The box waits for a keyword; Growsearch takes the whole
        sentence.
        {capturedAt ? (
          <>
            {" "}
            Captured at{" "}
            <a
              href={native.url}
              target="_blank"
              rel="noopener noreferrer"
              /* `anywhere`, not `break-all`: a host has hyphens and dots to
                 break at, and break-all ignored them and split
                 "northwind-and-c|o" at 390px. This only breaks when the
                 line would otherwise overflow. */
              className="font-semibold [overflow-wrap:anywhere] text-charcoal underline underline-offset-4 transition-colors hover:text-brand"
            >
              {capturedAt}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </>
        ) : null}
      </>
    );
  }

  return synthesised ? (
    <>
      <span className="font-semibold text-charcoal">
        {THEME_SOURCE_LINE.default}
      </span>{" "}
      On a store we can read, every colour above comes from the storefront
      itself.
    </>
  ) : (
    <>
      <span className="font-semibold text-charcoal">
        {THEME_SOURCE_LINE[result.themeSource]}
      </span>{" "}
      A mock-up of Growsearch on {result.store} &mdash; nothing was installed
      and nothing on your store changed.
    </>
  );
}

function StepList({ active, done }: { active: number; done: boolean }) {
  return (
    <ol className="space-y-4">
      {STEPS.map((label, i) => {
        const complete = done || i < active;
        const running = !done && i === active;
        return (
          <li key={label} className="flex items-center gap-4">
            <span
              aria-hidden
              className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                complete
                  ? "border-brand bg-brand text-white"
                  : running
                    ? "border-brand text-brand"
                    : "border-line text-muted"
              }`}
            >
              {complete ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m4 12.5 5.5 5.5L20 6.5"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : running ? (
                <span className="step-pulse block size-2.5 rounded-full bg-brand" />
              ) : (
                <span className="block size-2.5 rounded-full bg-line" />
              )}
            </span>
            <span
              className={`text-[16px] ${
                complete || running
                  ? "font-semibold text-charcoal"
                  : "text-muted"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function LoadingPanel({ store, step }: { store: string; step: number }) {
  return (
    <div className="rounded-[26px] border border-line bg-cream px-7 py-10 sm:px-10 sm:py-12">
      <p className="font-poppins text-[11px] font-bold tracking-[0.18em] text-brand uppercase">
        <span
          aria-hidden
          className="step-pulse mr-2 inline-block size-[7px] rounded-full bg-brand align-middle"
        />
        Working
      </p>
      <h2 className="font-poppins mt-3 text-[clamp(1.375rem,3.4vw,1.875rem)] leading-tight font-extrabold tracking-[-0.02em] text-charcoal">
        Building your preview of {store}
      </h2>
      <p className="mt-3 max-w-[52ch] text-[15.5px] leading-relaxed text-body-mute">
        This takes about twenty seconds. We&apos;re reading the public page
        only &mdash; nothing is being installed and nothing changes.
      </p>
      <div className="mt-8" aria-live="polite">
        <StepList active={step} done={false} />
      </div>
    </div>
  );
}

function ErrorPanel({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border-2 border-brand/25 bg-cream px-7 py-9 sm:px-10">
      <p className="font-poppins text-[11px] font-bold tracking-[0.18em] text-brand uppercase">
        Heads up
      </p>
      <h2 className="font-poppins mt-3 text-[clamp(1.375rem,3.4vw,1.75rem)] leading-tight font-extrabold tracking-[-0.02em] text-charcoal">
        {title}
      </h2>
      <p className="mt-3 max-w-[54ch] text-[15.5px] leading-relaxed text-body-mute">
        {body}
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-4 [&>*]:max-[430px]:w-full">
        {action}
      </div>
    </div>
  );
}

function DemoStoreCard() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_STORE_PASSWORD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* No clipboard permission — the password is on screen in plain text,
         so there is nothing to recover from. */
    }
  };

  return (
    <aside className="rounded-[26px] border border-line bg-white p-7 shadow-[0_24px_60px_-40px_rgba(23,23,23,0.5)]">
      <p className="font-poppins text-[11px] font-bold tracking-[0.18em] text-brand uppercase">
        <span
          aria-hidden
          className="mr-2 inline-block size-[7px] rounded-full bg-brand align-middle"
        />
        Your demo store
      </p>
      <h2 className="font-poppins mt-3 text-[21px] leading-snug font-extrabold tracking-[-0.02em] text-charcoal">
        Open the demo store
      </h2>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-body-mute">
        A live Shopify storefront running Growsearch, so there is nothing to
        install. Search it the way a shopper actually talks &mdash;
        &ldquo;something warm for a rainy commute&rdquo;.
      </p>

      {/* The storefront asks for this on arrival, so it has to be readable
          and grabbable before they go. */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-[14px] border-2 border-dashed border-brand/40 bg-cream px-5 py-3.5">
        <code className="font-poppins text-[22px] leading-none font-extrabold tracking-[0.08em] text-brand">
          {DEMO_STORE_PASSWORD}
        </code>
        <button
          type="button"
          onClick={copy}
          className="font-poppins shrink-0 rounded-[8px] border-2 border-brand px-3 py-1.5 text-[12.5px] font-bold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Password copied to clipboard" : ""}
      </p>

      <OpenDemoStoreButton className="cta-primary mt-5 w-full max-[359px]:px-4 max-[359px]:text-[15px]">
        Open the demo store
      </OpenDemoStoreButton>
      <p className="mt-3 text-center text-[12.5px] text-muted">
        Opens in a new tab, already unlocked.
      </p>

      {/* The card above is about someone else's store; this is the line where
          it becomes theirs. Kept below the demo button because the password
          and the button are one unit — but given the rule and its own copy so
          it does not read as the demo store's smaller sibling. */}
      <div className="mt-6 border-t border-line pt-5">
        {/* Turns over with the flag, so this never promises an App Store page
            that Shopify has not published yet. */}
        <p className="text-[13.5px] leading-relaxed text-body-mute">
          {SHOPIFY_LISTING_LIVE ? (
            <>
              Seen enough? Growsearch installs on your own store from the
              Shopify App Store.
            </>
          ) : (
            <>
              Seen enough? The listing is still in Shopify&apos;s review queue
              &mdash; take a place in the queue and we&apos;ll send your install
              link the day it clears.
            </>
          )}
        </p>
        <InstallOnShopify
          className="mt-3.5 w-full max-[359px]:px-4 max-[359px]:text-[15px]"
          source="try-preview"
        />
        <Link
          href="/pricing"
          className="mt-4 block text-center text-[13.5px] font-semibold text-charcoal underline underline-offset-4 transition-colors hover:text-brand"
        >
          Get my custom plan
        </Link>
      </div>
    </aside>
  );
}

export default function PreviewStage() {
  const router = useRouter();
  const params = useSearchParams();

  const store = (params.get("store") ?? "").trim().toLowerCase();
  const token = params.get("t") ?? "";

  /* Dev affordance: the real job needs a live store and a headless Chrome,
     so `?fixture=light|dark` stands in while the page is being built. Gated
     on NODE_ENV so it can never be reached in production. */
  const fixtureKey = params.get("fixture");
  const fixture =
    process.env.NODE_ENV !== "production" && isFixtureKey(fixtureKey)
      ? fixtureKey
      : null;

  useEffect(() => {
    if (!store) router.replace("/try");
  }, [store, router]);

  if (!store) return null;

  /* Keyed on the request, not mounted once. Two preview URLs are two different
     jobs, and going between them with the back button keeps this component
     mounted — without the key the second URL would render the first store's
     result under it, because both the fetch guard and the result live in state
     that only a remount clears. */
  return (
    <PreviewRun
      key={`${store}|${token}|${fixture ?? ""}`}
      store={store}
      token={token}
      fixture={fixture}
    />
  );
}

function PreviewRun({
  store,
  token,
  fixture,
}: {
  store: string;
  token: string;
  fixture: FixtureKey | null;
}) {
  /* Two of the three outcomes are known before the first paint — the dev
     fixture and "they arrived with no token" — so they are the initial state
     rather than an effect that immediately re-renders. */
  const [state, setState] = useState<State>(() => {
    if (fixture) return { status: "ready", result: FIXTURES[fixture] };
    if (!token) return { status: "error", code: null, message: "" };
    return { status: "loading" };
  });
  const [step, setStep] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!token || fixture) return;
    // StrictMode mounts effects twice in development; the job is a POST that
    // starts a browser, so it runs exactly once per mount — and the component
    // is remounted per request, so this guard cannot outlive its job.
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        const res = await fetch("/api/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ store, token }),
          /* The route caps itself at 60 s. Without a client cap of its own a
             hung function leaves the stepper sitting on "Drawing Growsearch
             on it" with nothing behind it, forever. */
          signal: timeoutSignal(55_000),
        });
        const data = (await res.json()) as PreviewResponse;
        if (data.ok) setState({ status: "ready", result: data });
        else setState({ status: "error", code: data.error, message: data.message });
      } catch (err) {
        const timedOut = isAbort(err);
        setState({
          status: "error",
          code: timedOut ? "timeout" : "unreachable",
          message: timedOut
            ? `${store} took longer than we're willing to make you wait. Big stores sometimes do — it's worth another go in a minute.`
            : `We couldn't reach ${store} just now.`,
        });
      }
    })();
  }, [store, token, fixture]);

  /* The stepper is honest about the shape of the job, not about its progress —
     the API returns one answer at the end, so the steps are timed to the run's
     usual length and every one of them completes the moment it lands. */
  useEffect(() => {
    if (state.status !== "loading") return;
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 2500);
    return () => window.clearInterval(id);
  }, [state.status]);

  const fallback = useMemo(() => fallbackResult(store), [store]);

  const expired =
    state.status === "error" &&
    (state.code === "unauthorized" || state.code === null);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12">
      <div className="min-w-0">
        {state.status === "loading" ? (
          <LoadingPanel store={store} step={step} />
        ) : state.status === "ready" ? (
          <Stage result={state.result} />
        ) : expired ? (
          <ErrorPanel
            title={
              state.code === null
                ? "We couldn't verify that link"
                : "That link has expired"
            }
            body={
              state.code === null
                ? `We didn't get a signed link for ${store}, so we can't start the job. Put your email in once more and we'll pick it straight back up.`
                : `Preview links are good for fifteen minutes. Ask for a fresh one for ${store} and we'll run it again.`
            }
            action={
              <Link
                href={`/try?store=${encodeURIComponent(store)}`}
                className="cta-primary"
              >
                Get a new link
                <Arrow className="cta-arrow size-5" />
              </Link>
            }
          />
        ) : (
          <>
            <ErrorPanel
              title={errorTitle(state.code, store)}
              body={
                state.message ||
                "The store didn't answer in time. Here's what Growsearch looks like anyway — the real thing wears your colours, your radius and your products."
              }
              action={
                <Link href="/try" className="cta-secondary">
                  Try another domain
                </Link>
              }
            />
            <div className="mt-8">
              <Stage result={fallback} synthesised />
            </div>
          </>
        )}
      </div>

      <DemoStoreCard />
    </div>
  );
}
