/**
 * Builds the personalised preview for one store.
 *
 * This endpoint makes outbound requests to a host the caller chooses, which is
 * the definition of an SSRF sink, so it is deliberately unfriendly: a signed
 * token proving the caller came through /api/trial-lead for this exact store, a
 * per-IP budget, and a host that has survived `normaliseStoreInput` before a
 * single packet leaves. The SSRF guard proper lives in `store-url.ts`.
 *
 * The rate limit is in-process, so it resets on deploy and does not span
 * instances. That is the right trade for a marketing site — it exists to stop a
 * bored visitor looping the form, not a determined attacker, and the real
 * ceiling is the token.
 */

import { buildPreview } from "@/lib/preview";
import { normaliseStoreInput, StoreAccessError } from "@/lib/preview/store-url";
import { verifyPreviewToken } from "@/lib/preview/token";
import type { PreviewErrorCode, PreviewResponse } from "@/lib/preview/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 10;

const hits = new Map<string, number[]>();

const MESSAGES: Record<PreviewErrorCode, string> = {
  invalid_store: "That doesn't look like a store domain. Try something like mystore.com.",
  unauthorized: "This preview link has expired. Pop your store in again and we'll rebuild it.",
  rate_limited: "That's a few previews in a row. Give it ten minutes and try again.",
  blocked: "We can only preview shops that are live on the public internet.",
  unreachable: "We couldn't reach that store. Check the domain and try again.",
  timeout: "That store took too long to answer, so we stopped waiting.",
  internal: "Something went wrong on our side while building your preview.",
};

function fail(code: PreviewErrorCode, status: number): Response {
  const body: PreviewResponse = { ok: false, error: code, message: MESSAGES[code] };
  return Response.json(body, { status });
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function overLimit(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);

  /* Sweep occasionally so a long-lived process does not hold every IP it ever
     saw. Cheap, and only when the Map has grown enough to be worth it. */
  if (hits.size > 500) {
    for (const [ip, times] of hits) {
      if (times.every((at) => now - at >= RATE_WINDOW_MS)) hits.delete(ip);
    }
  }
  return false;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_store", 400);
  }

  const { store, token } = (body ?? {}) as { store?: unknown; token?: unknown };

  if (typeof store !== "string" || typeof token !== "string") {
    return fail("invalid_store", 400);
  }

  /* Normalising before checking the token looks backwards, but the token is
     signed over the *normalised* host — we cannot verify anything until we have
     one, and telling a visitor their domain is wrong beats telling them their
     link expired when the domain is what actually went wrong. */
  const host = normaliseStoreInput(store);
  if (!host) return fail("invalid_store", 400);

  if (!verifyPreviewToken(token, host)) return fail("unauthorized", 401);

  if (overLimit(clientKey(request))) return fail("rate_limited", 429);

  try {
    const result = await buildPreview(host);
    const response: PreviewResponse = { ok: true, ...result };
    return Response.json(response);
  } catch (err) {
    if (err instanceof StoreAccessError) {
      console.info(`[preview] ${host}: ${err.code} — ${err.message}`);
      return fail(err.code, err.code === "blocked" ? 400 : 502);
    }
    console.error(`[preview] ${host}: unexpected failure`, err);
    return fail("internal", 500);
  }
}
