/**
 * Lead capture behind the demo-store gate and the "Try it free" form.
 *
 * The address goes to `marketing.lead` via `recordLead` in `src/lib/leads.ts`,
 * one row per (storefront, email) — a returning visitor is a no-op, a colleague
 * from the same shop is appended. That file owns the dedup; this one owns the
 * validation, the budget and the token.
 *
 * It also issues the preview token. `store` is optional: the "See demo" gate
 * sends an email and nothing else, and must keep working exactly as it did.
 * When a store is supplied it comes back normalised, with a signed 15-minute
 * token that /api/preview requires before it will touch the network. The token
 * is bound to the store, not to the person — it carries nothing about the lead.
 *
 * The order below is deliberate: budget, then validation, then the write, then
 * the token. The write comes before the token so a visitor is never handed a
 * preview we have not tried to record a lead for; the token comes *regardless*
 * of what the write said, because the database is not allowed to hold the
 * funnel shut — Supabase pauses a free project after a quiet week, and a
 * paused database on a Monday morning must cost us a row, not a lead who gave
 * up on a spinner.
 *
 * Two things this file must keep doing: never write the visitor's address to a
 * log line (it is a marketing lead, and the log is not where it belongs), and
 * never hand out tokens without a budget — minting them is cheap for us but it
 * is the front door to a route that launches browsers.
 */

import { createHash } from "node:crypto";

import { recordLead } from "@/lib/leads";
import { clientKey, overBudget } from "@/lib/preview/rate-limit";
import { normaliseStoreInput } from "@/lib/preview/store-url";
import { signPreviewToken } from "@/lib/preview/token";
import type { TrialLeadResponse } from "@/lib/preview/types";

/* Deliberately loose. A marketing form should reject the obvious typo and
   nothing else — RFC-shaped regexes turn away real addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * A stable, non-identifying handle for one address, so two log lines can be tied
 * together without the address being in either of them. Truncated because this
 * is for reading logs, not for looking anyone up.
 */
function reference(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}

/* Generous — this is a form a real person fills in once or twice — but not
   unlimited, because every success hands back a token for /api/preview. Lifted
   in dev, where there is no proxy to tell one caller from another and every
   request lands in the same bucket. */
const BUDGET = {
  limit: process.env.NODE_ENV === "development" ? 500 : 20,
  windowMs: 10 * 60 * 1000,
};

export async function POST(request: Request) {
  if (overBudget("trial-lead", clientKey(request), BUDGET)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { email, source, store } = (body ?? {}) as {
    email?: unknown;
    source?: unknown;
    store?: unknown;
  };

  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  /* Absent is fine; present-but-nonsense is not. Sending the visitor on to a
     preview we already know will fail wastes their click. */
  let host: string | null = null;
  if (store !== undefined && store !== null && store !== "") {
    if (typeof store !== "string") {
      return Response.json({ ok: false, error: "invalid_store" }, { status: 400 });
    }
    host = normaliseStoreInput(store);
    if (!host) {
      return Response.json({ ok: false, error: "invalid_store" }, { status: 400 });
    }
  }

  const address = email.trim().toLowerCase();
  const ref = reference(address);
  const from = typeof source === "string" ? source.slice(0, 64) : "unknown";

  try {
    const outcome = await recordLead({ email: address, domain: host, source: from });
    /* The address is in the row; the log gets the reference only. The outcome
       word is what lets a quiet week be told apart from a broken form: a run
       of `unavailable` is the database asleep, a run of `duplicate` is one
       person retrying. */
    console.info(`[trial-lead] ${outcome} ref=${ref} source=${from} store=${host ?? "-"}`);
  } catch (err) {
    /* `recordLead` does not throw — `tryDb` turns every query failure into
       `unavailable` — but `db()` builds the client *outside* that guard, and a
       malformed DATABASE_URL throws there. Not a reason to hold the demo shut
       on a visitor who has done the thing we asked. Only the message is
       logged: a postgres.js error object carries the query's parameters on
       it, and this parameter list is the address. */
    const why = err instanceof Error ? err.message : String(err);
    console.error(`[trial-lead] could not record lead ref=${ref} — ${why.slice(0, 200)}`);
  }

  const response: TrialLeadResponse =
    host ? { ok: true, store: host, token: signPreviewToken(host) } : { ok: true };
  return Response.json(response);
}
