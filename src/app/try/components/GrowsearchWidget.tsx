import type { PreviewProduct } from "@/lib/preview/types";

/**
 * The Growsearch widget from public/img/demos/rainy-commute.webp, rebuilt in
 * DOM so it can wear the visitor's own store.
 *
 * Not one colour is hard-coded: everything reads a `--gs-*` custom property
 * that PreviewStage sets from `PreviewTheme`, so the same markup renders on a
 * cream Shopify store and on a near-black one. Tints are `color-mix` against
 * `--gs-surface` rather than fixed alphas for the same reason — mixing toward
 * the store's own panel colour keeps a light accent readable on dark.
 *
 * Sizes are plain design pixels. The whole composition lives on a fixed
 * canvas that PreviewStage scales to the column (see StageCanvas), so nothing
 * here has to be responsive; `compact` only picks between the two canvases —
 * a 1440-wide desktop viewport and a 430-wide phone one.
 */

function Sparkle({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M12 2.5c.5 4.2 1.8 5.8 6 6.4-4.2.6-5.5 2.2-6 6.4-.5-4.2-1.8-5.8-6-6.4 4.2-.6 5.5-2.2 6-6.4Z"
        fill="currentColor"
      />
      <path
        d="M18.6 14.6c.26 2.1.9 2.9 3 3.2-2.1.3-2.74 1.1-3 3.2-.26-2.1-.9-2.9-3-3.2 2.1-.3 2.74-1.1 3-3.2Z"
        fill="currentColor"
        opacity=".7"
      />
    </svg>
  );
}

function MagnifierIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="m16 16 4.5 4.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookmarkIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 4.5h11a1 1 0 0 1 1 1v14l-6.5-4-6.5 4v-14a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.8 3.5h2.4l2.3 10.6h9.6l2.1-7.6H6.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19" r="1.6" fill="currentColor" />
      <circle cx="16.5" cy="19" r="1.6" fill="currentColor" />
    </svg>
  );
}

/* Tints. Mixing against the panel rather than against white keeps the same
   ratio of accent on a dark store, where an alpha wash over black goes muddy. */
const TINT_STRONG = "color-mix(in srgb, var(--gs-accent) 16%, var(--gs-surface))";
const TINT_SOFT = "color-mix(in srgb, var(--gs-accent) 10%, var(--gs-surface))";
const NEUTRAL = "color-mix(in srgb, var(--gs-text) 8%, var(--gs-surface))";

/* Corners follow the store's own button radius, damped: a shop with 24px
   buttons should not turn a 764px panel into a stadium, and one with square
   buttons should still get a panel you can look at. */
const RADIUS_PANEL = "calc(12px + var(--gs-radius) * 0.6)";
const RADIUS_SOFT = "calc(6px + var(--gs-radius) * 0.6)";
const RADIUS_CARD = "calc(4px + var(--gs-radius) * 0.5)";
const RADIUS_INNER = "calc(3px + var(--gs-radius) * 0.4)";

type Metrics = {
  /** Outer widget box, positioned over the frame by PreviewStage. */
  left: number;
  top: number;
  width: number;
  /** Search bar. */
  barInset: number;
  barHeight: number;
  barGap: number;
  panelHeight: number;
  pad: number;
  /** Desktop only: the assistant rail runs down the left. */
  railWidth: number;
  footerHeight: number;
  gridCols: number;
  gridRows: number;
  maxProducts: number;
};

export const DESKTOP: Metrics = {
  left: 160,
  top: 68,
  width: 1120,
  barInset: 60,
  barHeight: 68,
  barGap: 20,
  panelHeight: 764,
  pad: 28,
  railWidth: 330,
  footerHeight: 62,
  gridCols: 3,
  gridRows: 2,
  maxProducts: 6,
};

export const COMPACT: Metrics = {
  left: 14,
  top: 50,
  width: 402,
  barInset: 0,
  barHeight: 52,
  barGap: 12,
  panelHeight: 772,
  pad: 16,
  railWidth: 0,
  footerHeight: 46,
  gridCols: 2,
  gridRows: 2,
  maxProducts: 4,
};

function ProductCard({
  product,
  compact,
}: {
  product: PreviewProduct | null;
  compact: boolean;
}) {
  const t = compact
    ? { pad: 10, title: 13, price: 14, add: 30, icon: 30 }
    : { pad: 14, title: 15, price: 17.5, add: 36, icon: 36 };

  return (
    <div
      className="flex min-h-0 flex-col overflow-hidden"
      style={{
        borderRadius: RADIUS_CARD,
        border: "1px solid var(--gs-border)",
        background: "var(--gs-surface)",
      }}
    >
      <div className="min-h-0 flex-1" style={{ background: NEUTRAL }}>
        {product?.image ? (
          /* eslint-disable-next-line @next/next/no-img-element -- the source is
             the visitor's own storefront CDN (or a data URL from the fixture);
             next/image only optimises assets we can configure a loader for. */
          <img
            src={product.image}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>

      <div style={{ padding: t.pad }}>
        {product ? (
          <p
            className="line-clamp-2 font-semibold"
            style={{
              fontSize: t.title,
              lineHeight: 1.3,
              height: t.title * 2.6,
              color: "var(--gs-text)",
            }}
          >
            {product.title}
          </p>
        ) : (
          <div style={{ height: t.title * 2.6 }} className="flex flex-col gap-1.5">
            <span
              className="block w-full rounded-full"
              style={{ height: t.title * 0.7, background: NEUTRAL }}
            />
            <span
              className="block w-2/3 rounded-full"
              style={{ height: t.title * 0.7, background: NEUTRAL }}
            />
          </div>
        )}

        {product?.price ? (
          <p
            className="font-bold"
            style={{ fontSize: t.price, marginTop: 6, color: "var(--gs-text)" }}
          >
            {product.price}
          </p>
        ) : (
          <span
            className="mt-1.5 block rounded-full"
            style={{ height: t.price * 0.75, width: 52, background: NEUTRAL }}
          />
        )}

        <div className="flex items-center" style={{ gap: 8, marginTop: 10 }}>
          <span
            className="flex flex-1 items-center justify-center font-semibold"
            style={{
              height: t.add,
              borderRadius: RADIUS_INNER,
              background: TINT_STRONG,
              color: "var(--gs-accent)",
              fontSize: compact ? 12.5 : 14.5,
            }}
          >
            Add
          </span>
          <span
            className="grid shrink-0 place-items-center"
            style={{
              width: t.icon,
              height: t.icon,
              borderRadius: RADIUS_INNER,
              border: "1px solid var(--gs-border)",
              color: "var(--gs-muted)",
            }}
          >
            <BookmarkIcon size={compact ? 14 : 16} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GrowsearchWidget({
  products,
  storeTitle,
  query,
  compact = false,
}: {
  products: PreviewProduct[];
  storeTitle: string | null;
  /** The phrase the server chose. Never derived here — see the note above. */
  query: string;
  compact?: boolean;
}) {
  const m = compact ? COMPACT : DESKTOP;

  const shown = products.slice(0, m.maxProducts);
  const slots: (PreviewProduct | null)[] =
    shown.length > 0
      ? shown
      : Array.from({ length: m.gridCols * m.gridRows }, () => null);
  const rows = Math.min(m.gridRows, Math.ceil(slots.length / m.gridCols));

  const barRadius = m.barHeight / 2;

  /* The heading used to be picked from the query, which no longer belongs to
     this component. Naming the store is better anyway: it says the results
     came out of their catalogue, which is the claim being made. */
  // Store titles very often end in "Co." — a second full stop reads as a typo.
  const named = storeTitle?.replace(/\.$/, "");
  const heading = "Picks for you";
  const sub = named ? `Matched from ${named}.` : "Matched from your catalogue.";

  const t = compact
    ? { label: 11, body: 13.5, head: 16, sub: 12, foot: 12.5, bar: 16 }
    : { label: 13, body: 17, head: 22, sub: 15, foot: 16.5, bar: 24 };

  const assistant = (
    <>
      <p
        className="font-bold uppercase"
        style={{
          fontSize: t.label,
          letterSpacing: "0.18em",
          color: "var(--gs-accent)",
        }}
      >
        Assistant
      </p>

      <div
        style={{
          marginTop: compact ? 10 : 22,
          padding: compact ? 12 : 20,
          borderRadius: RADIUS_SOFT,
          background: TINT_SOFT,
        }}
        className="flex gap-3"
      >
        <span style={{ color: "var(--gs-accent)" }} className="mt-0.5 shrink-0">
          <Sparkle size={compact ? 14 : 18} />
        </span>
        <p style={{ fontSize: t.body, lineHeight: 1.5, color: "var(--gs-text)" }}>
          Which option best matches &ldquo;{query}&rdquo;?
        </p>
      </div>

      <div
        className="flex items-center gap-3"
        style={{ marginTop: compact ? 12 : 22 }}
      >
        <span style={{ color: "var(--gs-accent)" }} className="shrink-0">
          <Sparkle size={compact ? 14 : 18} />
        </span>
        <p style={{ fontSize: t.body, color: "var(--gs-text)" }}>
          Showing {shown.length > 0 ? shown.length : m.gridCols * m.gridRows}{" "}
          products.
        </p>
      </div>
    </>
  );

  const askRow = (
    <div className="flex items-center" style={{ gap: 10 }}>
      <span
        className="flex min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap"
        style={{
          height: compact ? 42 : 56,
          padding: `0 ${compact ? 12 : 16}px`,
          borderRadius: RADIUS_SOFT,
          border: "1px solid var(--gs-border)",
          color: "var(--gs-muted)",
          fontSize: compact ? 13 : 15,
        }}
      >
        Ask another question…
      </span>
      <span
        className="grid shrink-0 place-items-center font-bold"
        style={{
          height: compact ? 42 : 56,
          padding: `0 ${compact ? 18 : 24}px`,
          borderRadius: RADIUS_SOFT,
          background: "var(--gs-accent)",
          color: "var(--gs-accent-text)",
          fontSize: compact ? 13.5 : 17,
        }}
      >
        Ask
      </span>
    </div>
  );

  const results = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center" style={{ gap: 10 }}>
        <span style={{ color: "var(--gs-accent)" }} className="shrink-0">
          <Sparkle size={compact ? 16 : 22} />
        </span>
        <h3
          className="font-bold"
          style={{ fontSize: t.head, color: "var(--gs-text)" }}
        >
          {heading}
        </h3>
      </div>
      <p
        className="truncate"
        style={{ fontSize: t.sub, marginTop: 5, color: "var(--gs-muted)" }}
      >
        {sub}
      </p>

      <div
        className="grid min-h-0 flex-1"
        style={{
          marginTop: compact ? 12 : 18,
          gap: compact ? 12 : 18,
          gridTemplateColumns: `repeat(${m.gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {slots.map((p, i) => (
          <ProductCard
            key={p?.url ?? p?.title ?? `slot-${i}`}
            product={p}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="gs-widget absolute"
      style={{ left: m.left, top: m.top, width: m.width }}
      /* Decorative: it is a picture of a product, not a control. Screen
         readers get the plain-language summary PreviewStage renders instead. */
      aria-hidden
    >
      {/* Search bar */}
      <div
        className="flex items-center"
        style={{
          marginInline: m.barInset,
          height: m.barHeight,
          paddingInline: compact ? 14 : 26,
          gap: compact ? 10 : 18,
          borderRadius: barRadius,
          background: "var(--gs-surface)",
          border: "1px solid var(--gs-border)",
          boxShadow: "0 18px 40px -22px rgba(0,0,0,0.55)",
        }}
      >
        <span style={{ color: "var(--gs-text)" }} className="shrink-0">
          <Sparkle size={compact ? 16 : 24} />
        </span>
        <p
          className="min-w-0 flex-1 truncate"
          style={{ fontSize: t.bar, color: "var(--gs-text)" }}
        >
          {query}
        </p>
        <span style={{ color: "var(--gs-muted)" }} className="shrink-0">
          <ClearIcon size={compact ? 14 : 20} />
        </span>
        <span
          className="grid shrink-0 place-items-center rounded-full"
          style={{
            width: m.barHeight - (compact ? 14 : 18),
            height: m.barHeight - (compact ? 14 : 18),
            background: "var(--gs-accent)",
            color: "var(--gs-accent-text)",
          }}
        >
          <MagnifierIcon size={compact ? 16 : 22} />
        </span>
      </div>

      {/* Panel */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          marginTop: m.barGap,
          height: m.panelHeight,
          borderRadius: RADIUS_PANEL,
          background: "var(--gs-surface)",
          border: "1px solid var(--gs-border)",
          boxShadow: "0 40px 90px -40px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex min-h-0 flex-1">
          {compact ? (
            <div
              className="flex min-h-0 flex-1 flex-col"
              style={{ padding: m.pad }}
            >
              {assistant}
              <div style={{ height: 16 }} />
              {results}
              <div style={{ height: 12 }} />
              {askRow}
            </div>
          ) : (
            <>
              <div
                className="flex flex-col"
                style={{
                  width: m.railWidth,
                  padding: m.pad,
                  borderRight: "1px solid var(--gs-border)",
                }}
              >
                {assistant}
                <div className="flex-1" />
                {askRow}
              </div>
              <div
                className="flex min-h-0 flex-1 flex-col"
                style={{ padding: m.pad }}
              >
                {results}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex shrink-0 items-center justify-between"
          style={{
            height: m.footerHeight,
            paddingInline: m.pad,
            borderTop: "1px solid var(--gs-border)",
          }}
        >
          <span
            className="flex items-center gap-2 font-bold"
            style={{ fontSize: t.foot, color: "var(--gs-accent)" }}
          >
            See all results
            <svg
              width={compact ? 13 : 17}
              height={compact ? 13 : 17}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 12h15m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span
            className="flex items-center gap-2"
            style={{ fontSize: t.foot, color: "var(--gs-muted)" }}
          >
            <CartIcon size={compact ? 14 : 18} />
            Cart · 0 items
          </span>
        </div>
      </div>
    </div>
  );
}
