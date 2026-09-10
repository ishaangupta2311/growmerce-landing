/**
 * Rendering money and dates in the affiliate dashboard.
 *
 * Money is stored, passed around and summed as an integer number of minor
 * units, and only becomes a decimal here, at the last moment before it is
 * shown. That is the whole reason this file exists: the moment a balance is
 * held as `12.34` it is held as 12.339999999999999, and a partner comparing
 * their dashboard against their bank statement will find the cent.
 *
 * The formatters are built once and reused. `Intl.NumberFormat` is expensive to
 * construct and cheap to call, and a table of fifty commissions constructs one
 * per row otherwise.
 */

const MONEY_CACHE = new Map<string, Intl.NumberFormat>();

/**
 * A currency's minor-unit count, for the currencies that do not have two.
 *
 * `Intl` knows this, but only tells us through `resolvedOptions()`, which means
 * constructing a formatter to find out how to divide — so the answer is cached
 * alongside the formatter rather than recomputed. Yen has no minor unit at all,
 * so its "cents" are whole yen; dividing those by 100 would under-report a
 * balance by two orders of magnitude.
 */
function minorUnits(currency: string): number {
  const formatter = money(currency);
  return formatter.resolvedOptions().maximumFractionDigits ?? 2;
}

function money(currency: string): Intl.NumberFormat {
  const key = currency.toUpperCase();
  const cached = MONEY_CACHE.get(key);
  if (cached) return cached;

  /* `en-US` rather than the visitor's locale, and deliberately so: this is a
     figure a partner will quote back to us in an email, and it must read the
     same in the dashboard, in the payout note and in support's copy of it.
     A balance that renders as 1.234,56 on one machine and 1,234.56 on another
     is a support ticket. */
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: key });
  } catch {
    /* An unknown currency code — which can only arrive from an ingest event, so
       it is our own bug rather than the visitor's — must not blank the page.
       Show the number and the code and let somebody notice. */
    formatter = new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  MONEY_CACHE.set(key, formatter);
  return formatter;
}

/** `123456, "USD"` → `$1,234.56`. */
export function formatMoney(cents: number, currency: string): string {
  const divisor = 10 ** minorUnits(currency);
  return money(currency).format(cents / divisor);
}

/**
 * The same, with the fractional part dropped.
 *
 * For the headline figures only, where four significant digits and a pair of
 * cents compete for the same glance. Anywhere a partner might reconcile a
 * number against a bank statement — every table row, every payout — uses
 * `formatMoney`.
 */
export function formatMoneyShort(cents: number, currency: string): string {
  const divisor = 10 ** minorUnits(currency);
  const key = currency.toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: key,
      maximumFractionDigits: 0,
    }).format(cents / divisor);
  } catch {
    return formatMoney(cents, currency);
  }
}

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * `9 Sep 2026`, in UTC.
 *
 * UTC rather than the reader's zone because these dates are the boundaries of
 * billing periods and hold windows. Rendering a period that ends at midnight
 * UTC in the reader's local time moves it to the previous day for everyone west
 * of Greenwich, and a partner counting the thirty days to their payout should
 * not get a different answer than we do.
 */
export function formatDate(date: Date): string {
  return DATE.format(date);
}

/**
 * How long until a date, in the roundest honest unit — `in 12 days`, `today`,
 * `overdue`. Used for when a pending commission clears.
 */
export function formatCountdown(target: Date, now: Date = new Date()): string {
  const days = Math.ceil((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "clearing";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}
