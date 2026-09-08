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
 * instances, and it keys on an address the platform gave us rather than one the
 * caller wrote (see rate-limit.ts — the leftmost `x-forwarded-for` entry is
 * attacker-controlled and made this budget free to reset).
 *
 * The token is not the ceiling. /api/trial-lead will mint one for any host it is
 * asked about, so anyone can hold as many as they like; the token binds a job to
 * a store, it does not ration jobs. What actually caps the cost of a burst is
 * the two-browser semaphore in screenshot.ts, which no amount of address
 * rotation gets past.
 */

import { buildPreview } from "@/lib/preview";
import { clientKey, overBudget } from "@/lib/preview/rate-limit";
import { normaliseStoreInput, StoreAccessError } from "@/lib/preview/store-url";
import { verifyPreviewToken } from "@/lib/preview/token";
import type { PreviewErrorCode, PreviewResponse } from "@/lib/preview/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUDGET = { limit: 10, windowMs: 10 * 60 * 1000 };

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

  if (overBudget("preview", clientKey(request), BUDGET)) return fail("rate_limited", 429);

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
