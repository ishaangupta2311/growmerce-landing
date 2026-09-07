import type { PreviewResult } from "@/lib/preview/types";

/**
 * The browser the preview is staged in: chrome bar, then the visitor's own
 * storefront behind the widget.
 *
 * Two backdrops, one shape. When the job returned a screenshot we show it,
 * pushed back with a 1px blur and a scrim mixed from the store's own
 * background so the widget reads as foreground rather than as a second
 * screenshot. When it returned null — no browser on the box, or the page
 * refused to render — we draw the store instead from its theme: a header, a
 * hero band in the accent, a four-up product row. It is not their page, but
 * it is their colours, their radius and their name, which is the whole point.
 *
 * Sized in design pixels; see StageCanvas for the scaling.
 */

const NEUTRAL = "color-mix(in srgb, var(--gs-text) 8%, var(--gs-bg))";
const NEUTRAL_STRONG = "color-mix(in srgb, var(--gs-text) 14%, var(--gs-bg))";

function Dots({ size, gap }: { size: number; gap: number }) {
  return (
    <div className="flex shrink-0 items-center" style={{ gap }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <span
          key={c}
          className="block rounded-full"
          style={{ width: size, height: size, background: c }}
        />
      ))}
    </div>
  );
}

function SynthStorefront({
  result,
  compact,
}: {
  result: PreviewResult;
  compact: boolean;
}) {
  const name = result.title ?? result.store;
  const t = compact
    ? { pad: 18, header: 52, logo: 15, nav: 10, hero: 150, h1: 26, cards: 3 }
    : { pad: 56, header: 84, logo: 26, nav: 15, hero: 300, h1: 52, cards: 4 };

  return (
    <div className="size-full overflow-hidden" style={{ background: "var(--gs-bg)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          height: t.header,
          paddingInline: t.pad,
          borderBottom: "1px solid var(--gs-border)",
        }}
      >
        <div className="flex min-w-0 items-center" style={{ gap: 12 }}>
          {result.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element -- an absolute
               URL on the visitor's own CDN; there is no loader to give
               next/image for a domain we learn at request time. */
            <img
              src={result.logo}
              alt=""
              style={{ maxHeight: t.logo * 1.6, maxWidth: compact ? 120 : 260 }}
              className="object-contain"
            />
          ) : (
            <span
              className="truncate font-bold"
              style={{
                fontSize: t.logo,
                letterSpacing: "-0.02em",
                color: "var(--gs-text)",
              }}
            >
              {name}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center" style={{ gap: compact ? 12 : 28 }}>
          {["Shop", "Collections", "About", "Cart"]
            .slice(0, compact ? 2 : 4)
            .map((label) => (
              <span
                key={label}
                style={{ fontSize: t.nav, color: "var(--gs-muted)" }}
              >
                {label}
              </span>
            ))}
        </div>
      </div>

      {/* Hero band, in their accent */}
      <div
        className="flex items-center"
        style={{
          height: t.hero,
          paddingInline: t.pad,
          background: "var(--gs-accent)",
          color: "var(--gs-accent-text)",
        }}
      >
        <div>
          <p
            className="font-extrabold"
            style={{ fontSize: t.h1, lineHeight: 1.05, letterSpacing: "-0.03em" }}
          >
            New season, in stock.
          </p>
          <span
            className="mt-4 inline-flex items-center font-semibold"
            style={{
              paddingInline: compact ? 14 : 26,
              height: compact ? 30 : 48,
              fontSize: compact ? 11 : 16,
              borderRadius: "var(--gs-radius)",
              background: "var(--gs-accent-text)",
              color: "var(--gs-accent)",
            }}
          >
            Shop the edit
          </span>
        </div>
      </div>

      {/* Product row */}
      <div style={{ padding: t.pad }}>
        <span
          className="block rounded-full"
          style={{ width: compact ? 90 : 210, height: compact ? 10 : 18, background: NEUTRAL_STRONG }}
        />
        <div
          className="mt-6 grid"
          style={{
            gap: compact ? 12 : 26,
            gridTemplateColumns: `repeat(${t.cards}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: t.cards }, (_, i) => (
            <div key={i}>
              <div
                style={{
                  height: compact ? 96 : 230,
                  borderRadius: "var(--gs-radius)",
                  background: NEUTRAL,
                }}
              />
              <span
                className="mt-3 block rounded-full"
                style={{ width: "72%", height: compact ? 7 : 12, background: NEUTRAL_STRONG }}
              />
              <span
                className="mt-2 block rounded-full"
                style={{ width: "38%", height: compact ? 7 : 12, background: NEUTRAL }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StoreFrame({
  result,
  compact,
  chromeHeight,
}: {
  result: PreviewResult;
  compact: boolean;
  chromeHeight: number;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        borderRadius: compact ? 14 : 20,
        border: "1px solid rgba(23,23,23,0.14)",
        background: "var(--gs-bg)",
        boxShadow: "0 40px 90px -50px rgba(23,23,23,0.6)",
      }}
    >
      {/* Chrome */}
      <div
        className="flex shrink-0 items-center"
        style={{
          height: chromeHeight,
          gap: compact ? 10 : 18,
          paddingInline: compact ? 12 : 20,
          background: "#f2f0ee",
          borderBottom: "1px solid rgba(23,23,23,0.10)",
        }}
      >
        <Dots size={compact ? 8 : 11} gap={compact ? 5 : 7} />
        <div
          className="flex min-w-0 flex-1 items-center rounded-full"
          style={{
            gap: 8,
            height: compact ? 22 : 28,
            paddingInline: compact ? 10 : 14,
            background: "#ffffff",
            border: "1px solid rgba(23,23,23,0.08)",
          }}
        >
          {result.favicon ? (
            /* eslint-disable-next-line @next/next/no-img-element -- see above:
               an absolute URL on a domain we only learn at request time. */
            <img
              src={result.favicon}
              alt=""
              width={compact ? 11 : 14}
              height={compact ? 11 : 14}
              className="shrink-0 rounded-[3px] object-contain"
            />
          ) : (
            <svg
              width={compact ? 11 : 14}
              height={compact ? 11 : 14}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="shrink-0"
            >
              <path
                d="M7 10V7.5a5 5 0 0 1 10 0V10"
                stroke="#6b6b6b"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x="4.5"
                y="10"
                width="15"
                height="10"
                rx="2.5"
                stroke="#6b6b6b"
                strokeWidth="2"
              />
            </svg>
          )}
          <span
            className="truncate"
            style={{ fontSize: compact ? 10 : 13, color: "#4a4a4a" }}
          >
            {result.store}
          </span>
        </div>
      </div>

      {/* Storefront */}
      <div className="relative min-h-0 flex-1">
        {result.screenshot ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- this is a
                data: URL built by the preview job, so there is no remote asset
                for next/image to optimise and no domain to whitelist. */}
            <img
              src={result.screenshot}
              alt=""
              className="absolute inset-0 size-full object-cover object-top"
            />
            {/* Light on purpose. The page has to stay recognisably *their*
                store — that is the whole claim — so the scrim only takes the
                contrast down far enough for the widget to sit in front of it,
                and the panel's own shadow does the rest of the separating.
                Mixed from the store's own background so a dark storefront is
                dimmed rather than silvered. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "color-mix(in srgb, var(--gs-bg) 28%, transparent)",
              }}
            />
          </>
        ) : (
          <SynthStorefront result={result} compact={compact} />
        )}
      </div>
    </div>
  );
}
