import "server-only";

import { createHmac } from "node:crypto";
import { cache } from "react";
import { z } from "zod";

import type { AppRow, StoreList } from "./types";

/**
 * The admin's side of the app connection: every app in Your apps answers the
 * same two requests, so the next Shopify or WooCommerce app needs a row in
 * `apps.app`, not code here. The contract is written down in the Growsearch
 * repo, docs/admin-portal-stores.md.
 *
 * 1. `POST <app>/api/portal/stores`, signed like the email API
 *    (src/lib/growsearch/email.ts): an HMAC of timestamp, path and body under
 *    the app's secret, in two headers. The answer is the app's store list.
 * 2. `<app>/portal/<pass>`, framed by the store page: a read-only dashboard
 *    for one store. The pass names the store and an expiry, signed with the
 *    same secret.
 *
 * The secret is read from the environment variable the app's row names, on
 * every call, so a rotated secret takes effect without a restart.
 */

/** Apps may live on hosts that sleep; a cold start can take most of a minute. */
const TIMEOUT_MS = 60 * 1000;

/** How long a dashboard pass lasts. The app refuses anything over two hours. */
export const DASHBOARD_PASS_TTL_MS = 30 * 60 * 1000;

export type Answer<T> = { ok: true; data: T } | { ok: false; error: string };

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "not a date");

const storeSchema = z.object({
  id: z.string().min(1).max(300),
  platform: z.string().max(40),
  name: z.string().max(200),
  /* A hostname only: the store page links to https://<domain>. */
  domain: z.string().max(253).regex(/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i),
  plan: z.string().max(60).nullable(),
  status: z.enum(["active", "uninstalled"]),
  since: isoDate.nullable(),
  inactiveSince: isoDate.nullable(),
  activity: z
    .object({
      label: z.string().max(40),
      period: z.enum(["30d", "month"]),
      total: z.number().int().nonnegative(),
      previousTotal: z.number().int().nonnegative().nullable(),
      daily: z.array(z.number().int().nonnegative()).max(400).nullable(),
    })
    .nullable(),
  dashboard: z.boolean(),
});

const storeListSchema = z.object({
  ok: z.literal(true),
  generatedAt: isoDate,
  /* Each store is checked on its own below, so one odd entry is dropped
     rather than costing the whole list. */
  stores: z.array(z.unknown()).max(10_000),
});

/** The app's secret, or null when its environment variable is not set here. */
export function appSecret(app: AppRow): string | null {
  return process.env[app.secretEnv]?.trim() || null;
}

function sign(secret: string, message: string, encoding: "hex" | "base64url"): string {
  return createHmac("sha256", secret).update(message).digest(encoding);
}

async function post(app: AppRow, path: string, payload: object): Promise<Answer<unknown>> {
  const secret = appSecret(app);
  if (!secret) {
    return { ok: false, error: `${app.secretEnv} is not set on this deployment.` };
  }

  const body = JSON.stringify(payload);
  const timestamp = Date.now();
  const signature = sign(secret, `${timestamp}.${path}.${body}`, "hex");

  let response: Response;
  try {
    response = await fetch(`${app.baseUrl}${path}`, {
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
    return { ok: false, error: `${app.name} did not answer. Try again in a minute.` };
  }

  if (response.status === 401 || response.status === 503) {
    return {
      ok: false,
      error: `${app.name} refused the request. Check ${app.secretEnv} here matches the secret set on ${app.name}.`,
    };
  }
  const answer = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!response.ok || !answer?.ok) {
    return { ok: false, error: answer?.error || `${app.name} answered ${response.status}.` };
  }
  return { ok: true, data: answer };
}

/** How long a store list is reused across requests. Counting every shop's
    searches is real work for the app, and a store page, the switcher and
    the cards would otherwise each ask again. Failures are never kept. */
const LIST_REUSE_MS = 2 * 60 * 1000;

const recentLists = new Map<string, { at: number; list: StoreList }>();

async function requestStores(id: string, name: string, baseUrl: string, secretEnv: string): Promise<Answer<StoreList>> {
  const app = { id, name, baseUrl, secretEnv, platforms: [], iconUrl: null };
  const answer = await post(app, "/api/portal/stores", {});
  if (!answer.ok) return answer;

  const parsed = storeListSchema.safeParse(answer.data);
  if (!parsed.success) {
    console.warn(`[apps] ${id} sent a store list we could not read — ${parsed.error.message.slice(0, 200)}`);
    return { ok: false, error: `${name} answered with a store list this admin does not understand.` };
  }
  const stores = parsed.data.stores.flatMap((entry) => {
    const store = storeSchema.safeParse(entry);
    return store.success ? [store.data] : [];
  });
  const dropped = parsed.data.stores.length - stores.length;
  if (dropped) console.warn(`[apps] ${id} sent ${dropped} store${dropped === 1 ? "" : "s"} we could not read; left out`);
  return { ok: true, data: { stores, generatedAt: parsed.data.generatedAt } };
}

/* Keyed on plain values: `cache` matches arguments by identity, and each read
   of `apps.app` builds a new object. The key includes the address and secret
   name, so editing an app never serves the old app's list. */
const fetchStoresOnce = cache(
  async (id: string, name: string, baseUrl: string, secretEnv: string, fresh: boolean): Promise<Answer<StoreList>> => {
    const key = `${id}\n${baseUrl}\n${secretEnv}`;
    const kept = recentLists.get(key);
    if (!fresh && kept && Date.now() - kept.at < LIST_REUSE_MS) return { ok: true, data: kept.list };

    const answer = await requestStores(id, name, baseUrl, secretEnv);
    if (answer.ok) recentLists.set(key, { at: Date.now(), list: answer.data });
    return answer;
  },
);

/**
 * The app's store list. Never throws: a page that cannot reach an app says so
 * in a sentence instead of falling into the error boundary. Asked once per
 * request, however many parts of a page need it.
 */
export function fetchStores(app: AppRow): Promise<Answer<StoreList>> {
  return fetchStoresOnce(app.id, app.name, app.baseUrl, app.secretEnv, false);
}

/**
 * The address of one store's read-only dashboard, good for
 * DASHBOARD_PASS_TTL_MS. Null when the app's secret is not set.
 */
export function dashboardUrl(app: AppRow, storeId: string, now = Date.now()): string | null {
  const secret = appSecret(app);
  if (!secret) return null;
  const payload = Buffer.from(JSON.stringify({ v: 1, store: storeId, exp: now + DASHBOARD_PASS_TTL_MS })).toString(
    "base64url",
  );
  const pass = `${payload}.${sign(secret, `growmerce-dashboard.${payload}`, "base64url")}`;
  return `${app.baseUrl}/portal/${pass}`;
}

/** The settings page's connection check: a fresh store list, and how long the app took to give it. */
export async function checkConnection(app: AppRow): Promise<{ answer: Answer<StoreList>; ms: number }> {
  const started = performance.now();
  const answer = await fetchStoresOnce(app.id, app.name, app.baseUrl, app.secretEnv, true);
  return { answer, ms: Math.round(performance.now() - started) };
}
