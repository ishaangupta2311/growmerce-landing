/**
 * Formatting for the public blog. Dates render in UTC so a statically
 * generated page says the same day to every reader and on every rebuild.
 */

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function formatPostDate(iso: string | null): string {
  return iso ? DATE.format(new Date(iso)) : "";
}

/** "4 min read", at 225 words a minute. */
export function readingTime(text: string): string {
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 225))} min read`;
}
