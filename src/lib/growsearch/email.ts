import "server-only";

import { createHmac } from "node:crypto";

/**
 * Merchant email lives in the Growsearch app: the contact list, the lifecycle
 * emails, and the sending are all there, next to the installs they describe.
 * This is the admin's window onto it, over the app's signed
 * `/api/portal/email` API (specified in the app's `docs/merchant-email.md`).
 *
 * The signature is the affiliate scheme pointed the other way — the same two
 * headers, an HMAC of timestamp and body under a shared secret — with the
 * path signed too, so a captured request cannot be replayed against another
 * operation. The secret is its own, `PORTAL_EMAIL_SECRET`, not the affiliate
 * one: a key that can write to a ledger should not also be able to email
 * every merchant, and the reverse.
 */

const DEFAULT_APP_URL = "https://smart-search-gsog.onrender.com";

/** The app is on a host that sleeps; a cold start can take most of a minute. */
const TIMEOUT_MS = 60 * 1000;

export type EmailResults = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  lastSentAt: string | null;
};

export type LifecycleEmail = EmailResults & { key: string };

export type Audience = "installed" | "all";

export type Campaign = EmailResults & {
  id: string;
  subject: string;
  audience: Audience;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type ContactStatus = "subscribed" | "unsubscribed" | "uninstalled" | "no_address";

export type Contact = {
  shop: string;
  shopName: string | null;
  email: string | null;
  status: ContactStatus;
  subscribedAt: string;
  unsubscribedAt: string | null;
  uninstalledAt: string | null;
  sends: { emailKey: string; sentAt: string }[];
};

export type EmailOverview = {
  /** Whether the app has its Resend credentials. False means nothing sends. */
  configured: boolean;
  totals: { contacts: number; subscribed: number; unsubscribed: number; uninstalled: number };
  /** How many addresses a campaign to each audience would reach right now. */
  audiences: Record<Audience, number>;
  lifecycle: LifecycleEmail[];
  campaigns: Campaign[];
  contacts: Contact[];
};

export type CampaignInput = {
  id: string;
  subject: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  audience: Audience;
  createdBy: string;
  /** Present for a test: one sample goes here and nothing is stored. */
  testTo?: string;
};

export type CampaignReceipt =
  | { test: true; sentTo: string }
  | { test?: false; id: string; created: boolean; recipients: number };

export type SweepReceipt = {
  configured: boolean;
  contacts: number;
  sent: { shop: string; emailKey: string }[];
  failed: { shop: string; message: string }[];
};

export type Answer<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * One signed call. Never throws: an admin page that cannot reach the app
 * should say so in a sentence, not fall over into the error boundary.
 */
async function call<T>(operation: string, payload: object): Promise<Answer<T>> {
  const secret = process.env.PORTAL_EMAIL_SECRET?.trim();
  if (!secret) {
    return { ok: false, error: "PORTAL_EMAIL_SECRET is not set on this deployment." };
  }

  const base = (process.env.GROWSEARCH_APP_URL?.trim() || DEFAULT_APP_URL).replace(/\/+$/, "");
  const path = `/api/portal/email/${operation}`;
  const body = JSON.stringify(payload);
  const timestamp = Date.now();
  const signature = createHmac("sha256", secret).update(`${timestamp}.${path}.${body}`).digest("hex");

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-growmerce-timestamp": String(timestamp),
        "x-growmerce-signature": `sha256=${signature}`,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: "The Growsearch app did not answer. Try again in a minute." };
  }

  const answer = (await response.json().catch(() => null)) as ({ ok?: boolean; error?: string } & T) | null;
  if (response.status === 401 || response.status === 503) {
    return {
      ok: false,
      error: "The Growsearch app refused the request. Check PORTAL_EMAIL_SECRET is the same on both sides.",
    };
  }
  if (!response.ok || !answer?.ok) {
    return { ok: false, error: answer?.error || `The Growsearch app answered ${response.status}.` };
  }
  return { ok: true, data: answer };
}

export function emailOverview(): Promise<Answer<EmailOverview>> {
  return call<EmailOverview>("overview", {});
}

export function sendCampaign(input: CampaignInput): Promise<Answer<CampaignReceipt>> {
  return call<CampaignReceipt>("send-campaign", input);
}

export function runEmailSweep(): Promise<Answer<SweepReceipt>> {
  return call<SweepReceipt>("sweep", {});
}
