/**
 * `22 Oct 2026, 14:05 UTC`. UTC, like the rest of the admin's dates, so the
 * seven-day cap reads the same to everybody; the time matters because the cap
 * is counted to the minute, not the day.
 */
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

export function formatDateTime(value: string | Date): string {
  return `${DATE_TIME.format(new Date(value))} UTC`;
}
