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

export function pageFrom(raw: string | undefined, pageCount: number): number {
  const n = Number.parseInt(raw ?? "", 10);
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
