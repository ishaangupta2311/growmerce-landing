/**
 * The install waitlist, taken while the Shopify listing is still in review.
 *
 * Every "Install on Shopify" on the site opens a form instead of the App
 * Store, because there is nothing to open yet. What that form collects lands
 * in `marketing.waitlist` via `recordWaitlistSignup`; that file owns the
 * dedup, this one owns the budget, the validation and the logging.
 *
 * Deliberately close to `/api/trial-lead` in shape, and deliberately smaller:
 * there is no token to mint here and nothing downstream that costs money, so
 * the request ends when the row does.
 *
 * Two things this file must keep doing: never write the merchant's address to
 * a log line, and never fail the visitor over the database. Supabase pauses a
 * free project after a quiet week, and a paused database must cost us a row —
 * not a merchant who did the thing we asked. So an `unavailable` write still
 * answers `ok`, and the log line is what tells the two apart afterwards.
 */

import { createHash } from "node:crypto";

import { clientKey, overBudget } from "@/lib/preview/rate-limit";
import { normaliseStoreInput } from "@/lib/store-domain";
import { recordWaitlistSignup } from "@/lib/waitlist";

/* Character-for-character the check in the form, so a rejection the visitor
   can act on is shown by our copy rather than by a bare 400. Deliberately
   loose: a marketing form should reject the obvious typo and nothing else. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * A stable, non-identifying handle for one address, so two log lines can be
 * tied together without the address being in either of them. Truncated because
 * this is for reading logs, not for looking anyone up.
 */
function reference(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}

/* Generous — this is a form a real merchant fills in once — but not unlimited,
   because an unbounded form is a way to fill our table for free. Lifted in
   dev, where there is no proxy to tell one caller from another and every
   request lands in the same bucket. */
const BUDGET = {
  limit: process.env.NODE_ENV === "development" ? 500 : 20,
  windowMs: 10 * 60 * 1000,
};

export async function POST(request: Request) {
  if (overBudget("waitlist", clientKey(request), BUDGET)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { email, store, name, source } = (body ?? {}) as {
    email?: unknown;
    store?: unknown;
    name?: unknown;
    source?: unknown;
  };

  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  /* Required, unlike the trial form's optional store: this row exists so that
     on launch day we can tell a merchant their store is ready. One we cannot
     tie to a storefront is one we cannot act on. */
  if (typeof store !== "string") {
    return Response.json({ ok: false, error: "invalid_store" }, { status: 400 });
  }
  const host = normaliseStoreInput(store);
  if (!host) {
    return Response.json({ ok: false, error: "invalid_store" }, { status: 400 });
  }

  const address = email.trim().toLowerCase();
  const ref = reference(address);
  const from = typeof source === "string" ? source.slice(0, 64) : "unknown";
  const who = typeof name === "string" && name.trim() ? name.trim() : null;

  try {
    const outcome = await recordWaitlistSignup({
      email: address,
      domain: host,
      name: who,
      source: from,
    });
    /* The address is in the row; the log gets the reference only. The outcome
       word is what lets a quiet week be told apart from a broken form: a run
       of `unavailable` is the database asleep, a run of `duplicate` is one
       merchant retrying. */
    console.info(`[waitlist] ${outcome} ref=${ref} source=${from} store=${host}`);
  } catch (err) {
    /* `recordWaitlistSignup` does not throw — `tryDb` turns every query
       failure into `unavailable` — but `db()` builds the client *outside* that
       guard, and a malformed DATABASE_URL throws there. Not a reason to tell a
       merchant their signup failed. Only the message is logged: a postgres.js
       error object carries the query's parameters on it, and this parameter
       list is the address. */
    const why = err instanceof Error ? err.message : String(err);
    console.error(`[waitlist] could not record signup ref=${ref} — ${why.slice(0, 200)}`);
  }

  return Response.json({ ok: true });
}
