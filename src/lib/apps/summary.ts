import type { AppStore } from "./types";

/**
 * The figures above an app's store list and on its card, worked out from the
 * list the app sent. Pure, so the card and the page cannot disagree.
 */

/** Days of silence after which an installed store is worth a look. */
export const QUIET_DAYS = 7;

/** An installed store with a daily series whose last week has no searches. */
export function isQuiet(store: AppStore): boolean {
  const daily = store.activity?.period === "30d" ? store.activity.daily : null;
  if (store.status !== "active" || !daily || daily.length < QUIET_DAYS) return false;
  return daily.slice(-QUIET_DAYS).every((count) => count === 0);
}

export type AppSummary = {
  active: number;
  uninstalled: number;
  /** Installed stores first seen this calendar month. */
  newThisMonth: number;
  uninstalledThisMonth: number;
  /** Searches over the last 30 days, across stores that report them. */
  searches30d: number;
  /** The same stores' 30 days before that; null when none had any. */
  previous30d: number | null;
  /** Searches this month from stores that only report a monthly figure. */
  searchesThisMonth: number;
  quiet: number;
};

export function summarize(stores: AppStore[], now = new Date()): AppSummary {
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const inThisMonth = (iso: string | null) => iso !== null && Date.parse(iso) >= monthStart;

  let searches30d = 0;
  let previous30d: number | null = null;
  let searchesThisMonth = 0;
  for (const store of stores) {
    const activity = store.activity;
    if (!activity) continue;
    if (activity.period === "30d") {
      searches30d += activity.total;
      if (activity.previousTotal !== null) previous30d = (previous30d ?? 0) + activity.previousTotal;
    } else {
      searchesThisMonth += activity.total;
    }
  }

  const active = stores.filter((store) => store.status === "active");
  const uninstalled = stores.filter((store) => store.status === "uninstalled");
  return {
    active: active.length,
    uninstalled: uninstalled.length,
    newThisMonth: active.filter((store) => inThisMonth(store.since)).length,
    uninstalledThisMonth: uninstalled.filter((store) => inThisMonth(store.inactiveSince)).length,
    searches30d,
    previous30d,
    searchesThisMonth,
    quiet: stores.filter(isQuiet).length,
  };
}

/** "214k", "1.2M": for a figure on a small card. */
export function compactNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** "+18%" against the previous period, or null when there is nothing to compare. */
export function percentChange(current: number, previous: number | null): string | null {
  if (!previous) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? "+" : ""}${change}%`;
}
