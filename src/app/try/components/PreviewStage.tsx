"use client";

import {
  useEffect,
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
import { DEMO_STORE_PASSWORD } from "@/lib/site-urls";
import {
  DEFAULT_THEME,
  type PreviewErrorCode,
  type PreviewResponse,
  type PreviewResult,
  type PreviewTheme,
} from "@/lib/preview/types";
import StoreFrame from "./StoreFrame";
import GrowsearchWidget from "./GrowsearchWidget";
import { FIXTURES } from "./fixture";

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
    default:
      return `We couldn't reach ${store}`;
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
}: {
  result: PreviewResult;
  compact: boolean;
}) {
  return (
    <div className={compact ? "gs-canvas gs-canvas--compact" : "gs-canvas gs-canvas--wide"}>
      <div className="gs-inner">
        <StoreFrame
          result={result}
          compact={compact}
          chromeHeight={compact ? COMPACT_CANVAS.chrome : DESKTOP_CANVAS.chrome}
        />
        <GrowsearchWidget
          products={result.products}
          storeTitle={result.title}
          compact={compact}
        />
      </div>
    </div>
  );
}

function Stage({ result }: { result: PreviewResult }) {
  return (
    <div className="gs-stage w-full" style={themeVars(result.theme)}>
      <Canvas result={result} compact={false} />
      <Canvas result={result} compact />
    </div>
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
        This takes about fifteen seconds. Your demo store is already open in
        the other tab if you&apos;d rather start there.
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

function DemoStoreCard({ opened }: { opened: boolean }) {
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
        {opened ? "It opened in a new tab" : "Open the demo store"}
      </h2>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-body-mute">
        Growsearch is already live on it. Search the way a shopper actually
        talks &mdash; &ldquo;something warm for a rainy commute&rdquo;.
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
        {opened ? "Open it again" : "Open the demo store"}
      </OpenDemoStoreButton>
      <Link href="/pricing" className="cta-secondary mt-3 w-full">
        Get my custom plan
      </Link>
      <p className="mt-4 text-center text-[12.5px] text-muted">
        Opens in a new tab, already unlocked.
      </p>
    </aside>
  );
}

export default function PreviewStage() {
  const router = useRouter();
  const params = useSearchParams();

  const store = (params.get("store") ?? "").trim().toLowerCase();
  const token = params.get("t") ?? "";
  const openedAlready = params.get("o") === "1";

  /* Dev affordance: the real job needs a live store and a headless Chrome,
     so `?fixture=light|dark` stands in while the page is being built. Gated
     on NODE_ENV so it can never be reached in production. */
  const fixtureKey = params.get("fixture");
  const fixture =
    process.env.NODE_ENV !== "production" &&
    (fixtureKey === "light" || fixtureKey === "dark")
      ? fixtureKey
      : null;

  /* Two of the three outcomes are known before the first paint — the dev
     fixture and "they arrived with no token" — so they are the initial state
     rather than an effect that immediately re-renders. */
  const [state, setState] = useState<State>(() => {
    if (fixture) return { status: "ready", result: FIXTURES[fixture] };
    if (store && !token) return { status: "error", code: null, message: "" };
    return { status: "loading" };
  });
  const [step, setStep] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!store) {
      router.replace("/try");
      return;
    }
    if (!token || fixture) return;
    // StrictMode mounts effects twice in development; the job is a POST that
    // starts a browser, so it runs exactly once per page.
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        const res = await fetch("/api/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ store, token }),
        });
        const data = (await res.json()) as PreviewResponse;
        if (data.ok) setState({ status: "ready", result: data });
        else setState({ status: "error", code: data.error, message: data.message });
      } catch {
        setState({
          status: "error",
          code: "unreachable",
          message: `We couldn't reach ${store} just now.`,
        });
      }
    })();
  }, [store, token, fixture, router]);

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

  if (!store) return null;

  const expired = state.status === "error" && (state.code === "unauthorized" || state.code === null);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12">
      <div className="min-w-0">
        {state.status === "loading" ? (
          <LoadingPanel store={store} step={step} />
        ) : state.status === "ready" ? (
          <>
            <Stage result={state.result} />
            <p className="mt-5 text-[14.5px] text-body-mute">
              <span className="font-semibold text-charcoal">
                {THEME_SOURCE_LINE[state.result.themeSource]}
              </span>{" "}
              This is a mock-up of Growsearch on {state.result.store} &mdash;
              nothing was installed and nothing on your store changed.
            </p>
          </>
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
              <Stage result={fallback} />
            </div>
            <p className="mt-5 text-[14.5px] text-body-mute">
              <span className="font-semibold text-charcoal">
                {THEME_SOURCE_LINE.default}
              </span>{" "}
              On a store we can read, every colour above comes from the
              storefront itself.
            </p>
          </>
        )}
      </div>

      <DemoStoreCard opened={openedAlready} />
    </div>
  );
}
