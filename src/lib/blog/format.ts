/**
 * Formatting for the public blog.
 *
 * Published dates are deliberately not shown anywhere on the public side —
 * see the comment in src/components/blog/BlogCard.tsx — so there is no date
 * formatter here. The dates themselves are still carried in each post's
 * metadata and structured data for search engines, and the admin shows them
 * in the reader's own timezone through `LocalTime`.
 */

/** "4 min read", at 225 words a minute. */
export function readingTime(text: string): string {
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 225))} min read`;
}
