import Link, { type LinkProps } from "next/link";

import { rangeOn } from "@/lib/affiliate/paging";
import { clsx } from "@/lib/clsx";

/**
 * Previous / numbered / next, under a paginated table.
 *
 * Plain links, so it works before JavaScript loads and a page can be
 * bookmarked or sent to somebody. The numbers are windowed around the current
 * page — an agency with three thousand stores does not need sixty buttons —
 * but the first and last are always there, because "how many pages is this"
 * is the question the bar exists to answer.
 *
 * Renders nothing for a single page. The count in the heading already says
 * how many rows there are; a bar with one button would only say it again —
 * which is also why the summary line below is always plural. It is only
 * reached when there are more than a page of rows behind it.
 */
export default function Pager({
  page,
  pageCount,
  total,
  href,
  noun,
}: {
  page: number;
  pageCount: number;
  total: number;
  /** The URL for a page. Page 1 should be the bare path, so the canonical URL stays clean. */
  href: (page: number) => LinkProps["href"];
  /** What the rows are, singular — "commission", "store" — for the summary line. */
  noun: string;
}) {
  if (pageCount <= 1) return null;

  const { from, to } = rangeOn(page, total);

  return (
    <nav
      aria-label={`${noun} pages`}
      className="flex flex-wrap items-center justify-between gap-3 px-1"
    >
      <p className="text-[14px] text-body-mute">
        Showing {from}–{to} of {total} {noun}s
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} rel="prev" className={EDGE}>
            ← Newer
          </Link>
        )}
        {windowAround(page, pageCount).map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} aria-hidden className="px-1 text-muted">
              …
            </span>
          ) : (
            <Link
              key={n}
              href={href(n)}
              aria-current={n === page ? "page" : undefined}
              className={clsx(
                "grid size-10 place-items-center rounded-[10px] text-[15px] font-bold",
                n === page ? "bg-brand text-white" : "text-charcoal hover:bg-cream hover:text-brand",
              )}
            >
              {n}
            </Link>
          ),
        )}
        {page < pageCount && (
          <Link href={href(page + 1)} rel="next" className={EDGE}>
            Older →
          </Link>
        )}
      </div>
    </nav>
  );
}

const EDGE =
  "rounded-[10px] border border-line px-4 py-2 text-[15px] font-bold text-charcoal " +
  "hover:border-brand hover:text-brand";

/** `1 … 4 5 [6] 7 8 … 40`: the current page with two neighbours each side, plus both ends. */
function windowAround(page: number, pageCount: number): (number | null)[] {
  const wanted = new Set<number>([1, pageCount]);
  for (let n = page - 2; n <= page + 2; n++) {
    if (n >= 1 && n <= pageCount) wanted.add(n);
  }
  const sorted = [...wanted].sort((a, b) => a - b);

  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    const previous = sorted[i - 1];
    if (i > 0 && n - previous > 1) {
      /* A gap of exactly one page gets the page rather than an ellipsis. On
         page 5 of 10 the first `…` stood for page 2 alone, which is a
         character wider than the number it was hiding and costs a click to
         find out what it was. */
      out.push(n - previous === 2 ? previous + 1 : null);
    }
    out.push(n);
  });
  return out;
}
