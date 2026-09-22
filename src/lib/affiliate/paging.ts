/**
 * Page arithmetic for the dashboard's two history views.
 *
 * Fifty rows a page. Both tables used to stop quietly at 200: an agency with
 * 201 stores saw 200 of them under a heading that said 200, while the lifetime
 * totals above the table counted all 201. A page count from a real total is
 * what makes "every commission" mean every commission.
 *
 * The page number comes from the URL, so it is a string anybody can edit.
 * Anything that is not a whole number from 1 upward reads as page 1, and a
 * number past the end reads as the last page rather than an empty table with
 * no way back.
 */

export const PAGE_SIZE = 50;

export function pageCountFor(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function pageFrom(raw: string | string[] | undefined, pageCount: number): number {
  /* An array because Next resolves a repeated search parameter to every value
     it was given, and `?page=2&page=5` is a URL somebody can type or a link
     somebody can build wrong. The last value is the one the address bar ends
     with; parsing the array itself would be NaN, which reads as page 1 and
     looks like the pager is broken. */
  const value = Array.isArray(raw) ? raw[raw.length - 1] : raw;
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, pageCount);
}

/** The rows a page starts at, for the query's `offset`. */
export function offsetFor(page: number): number {
  return (page - 1) * PAGE_SIZE;
}

/** The 1-based row range a page shows, for "Showing 51–100 of 212". */
export function rangeOn(page: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  return { from: offsetFor(page) + 1, to: Math.min(page * PAGE_SIZE, total) };
}
