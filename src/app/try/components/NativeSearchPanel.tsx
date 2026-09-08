import type { NativeSearch } from "@/lib/preview/types";
import { COMPACT, DESKTOP } from "./GrowsearchWidget";

/**
 * The store's own search, answering the same question — the "before" half of
 * the comparison.
 *
 * Everything here is real: the server typed `query` into the storefront's own
 * search endpoint and this renders what came back, including nothing. That is
 * why the copy is flat. An empty result is the ordinary outcome when a shopper
 * types a sentence at a keyword index, and it makes the point on its own; a
 * caption needling them about it would turn a fact into a sales pitch, and
 * they would be right to distrust the rest of the page after reading it.
 *
 * It is deliberately plainer than the Growsearch panel: a bordered input, a
 * bare grid, no assistant, no sparkles, no counts we were not given. It still
 * wears the store's `--gs-*` variables so it reads as their site — the
 * difference between the two states should be the search, not the branding.
 *
 * Position is taken from the same metrics the Growsearch widget uses, so the
 * toggle swaps like for like rather than moving things around.
 */
export default function NativeSearchPanel({
  search,
  query,
  compact = false,
}: {
  search: NativeSearch;
  /** Passed in rather than read off `search`, so it is the same binding the
      Growsearch panel gets and the two cannot drift. */
  query: string;
  compact?: boolean;
}) {
  const m = compact ? COMPACT : DESKTOP;
  const products = search.products.slice(0, 6);
  const cols = compact ? 2 : 3;

  const t = compact
    ? { bar: 14, head: 13, body: 12.5, title: 12.5, price: 13, pad: 14 }
    : { bar: 20, head: 16, body: 15, title: 14, price: 15.5, pad: 24 };

  return (
    <div
      className="absolute"
      style={{ left: m.left, top: m.top, width: m.width }}
      /* Decorative, like the Growsearch panel: the caption under the frame is
         what a screen reader is given. */
      aria-hidden
    >
      {/* Search field — a plain box, the shape a default theme ships. */}
      <div
        className="flex items-center"
        style={{
          marginInline: m.barInset,
          height: m.barHeight,
          paddingInline: compact ? 14 : 20,
          gap: compact ? 10 : 14,
          borderRadius: "var(--gs-radius)",
          background: "var(--gs-surface)",
          border: "1px solid var(--gs-border)",
          boxShadow: "0 10px 24px -18px rgba(0,0,0,0.45)",
        }}
      >
        <p
          className="min-w-0 flex-1 truncate"
          style={{ fontSize: t.bar, color: "var(--gs-text)" }}
        >
          {query}
        </p>
        <svg
          width={compact ? 15 : 20}
          height={compact ? 15 : 20}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="shrink-0"
          style={{ color: "var(--gs-muted)" }}
        >
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path
            d="m16 16 4.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Results */}
      <div
        style={{
          marginTop: m.barGap,
          padding: t.pad,
          borderRadius: "var(--gs-radius)",
          background: "var(--gs-surface)",
          border: "1px solid var(--gs-border)",
          boxShadow: "0 18px 40px -30px rgba(0,0,0,0.5)",
        }}
      >
        {products.length === 0 ? (
          <>
            <p
              className="font-semibold"
              style={{ fontSize: t.head, color: "var(--gs-text)" }}
            >
              No results found for &ldquo;{query}&rdquo;.
            </p>
            <p
              style={{
                fontSize: t.body,
                marginTop: 8,
                color: "var(--gs-muted)",
              }}
            >
              Check your spelling or try a different search term.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: t.head, color: "var(--gs-text)" }}>
              {search.total === null
                ? `Results for “${query}”`
                : `${search.total} ${search.total === 1 ? "result" : "results"} for “${query}”`}
            </p>
            <div
              className="grid"
              style={{
                marginTop: compact ? 12 : 18,
                gap: compact ? 12 : 18,
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {products.map((product, i) => (
                <div key={product.url ?? product.title ?? `native-${i}`}>
                  <div
                    style={{
                      height: compact ? 88 : 132,
                      background:
                        "color-mix(in srgb, var(--gs-text) 8%, var(--gs-surface))",
                      overflow: "hidden",
                    }}
                  >
                    {product.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- the
                         visitor's own storefront CDN on a domain we only learn at
                         request time; there is no loader to give next/image. */
                      <img
                        src={product.image}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                  <p
                    className="line-clamp-2"
                    style={{
                      fontSize: t.title,
                      lineHeight: 1.35,
                      marginTop: 8,
                      color: "var(--gs-text)",
                    }}
                  >
                    {product.title}
                  </p>
                  {product.price ? (
                    <p
                      style={{
                        fontSize: t.price,
                        marginTop: 4,
                        color: "var(--gs-muted)",
                      }}
                    >
                      {product.price}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
