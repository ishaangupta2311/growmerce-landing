/**
 * Your apps: shapes shared by the pages, the Server Actions and the client
 * components. Client-safe: types and constants only.
 */

export const PLATFORMS = ["shopify", "woocommerce"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABEL: Record<Platform, string> = {
  shopify: "Shopify",
  woocommerce: "WooCommerce",
};

/** What the admin knows about an app: a row in `apps.app`. */
export type AppRow = {
  id: string;
  name: string;
  platforms: Platform[];
  baseUrl: string;
  /** The name of the environment variable holding the shared secret. */
  secretEnv: string;
  iconUrl: string | null;
};

/**
 * One store in an app's list, as every app answers it. The contract is
 * documented in the Growsearch repo, docs/admin-portal-stores.md.
 */
export type AppStore = {
  /** The app's own id for the store, e.g. "shopify:northwind.myshopify.com". */
  id: string;
  platform: string;
  name: string;
  domain: string;
  plan: string | null;
  status: "active" | "uninstalled";
  /** ISO dates. */
  since: string | null;
  inactiveSince: string | null;
  /** Null when the app could not count this store. */
  activity: {
    label: string;
    /** `30d`: the last 30 days, with a daily series. `month`: this calendar month so far. */
    period: "30d" | "month";
    total: number;
    previousTotal: number | null;
    daily: number[] | null;
  } | null;
  /** Whether the app can show this store's dashboard. */
  dashboard: boolean;
};

export type StoreList = {
  stores: AppStore[];
  /** When the app built the list, ISO. */
  generatedAt: string;
};

/** A store plus whether an admin starred it, for the store table. */
export type StoreRow = AppStore & { starred: boolean };

/** The secret's environment variable must be named like this. Mirrors the check in migrations/0011_apps.sql. */
export const SECRET_ENV_PATTERN = /^[A-Z][A-Z0-9_]{0,40}_ANALYTICS_SECRET$/;
