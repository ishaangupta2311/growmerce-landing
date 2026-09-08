/**
 * Lead capture behind the demo-store gate and the "Try it free" form.
 *
 * MOCK. No email platform is wired up yet, so a captured address is validated
 * and then goes nowhere. The flow in front of it is real — the visitor is gated
 * on entering an address either way — but nothing here persists it, so treat
 * leads taken before this is wired as lost.
 *
 * It also issues the preview token. `store` is optional: the "See demo" gate
 * sends an email and nothing else, and must keep working exactly as it did.
 * When a store is supplied it comes back normalised, with a signed 15-minute
 * token that /api/preview requires before it will touch the network. The token
 * is bound to the store, not to the person — it carries nothing about the lead.
 *
 * Two things this file must keep doing: never write the visitor's address to a
 * log line (it is a marketing lead, and the log is not where it belongs), and
 * never hand out tokens without a budget — minting them is cheap for us but it
 * is the front door to a route that launches browsers.
 *
 * To make it real, replace the body of `recordLead` with the call to whatever
 * platform you land on (Omnisend, Klaviyo, HubSpot, a Sheet, a database).
 * That function is the only thing that needs to change; the validation, the
 * shape of a lead and the client are all independent of the destination.
 */

import { createHash } from "node:crypto";

import { clientKey, overBudget } from "@/lib/preview/rate-limit";
import { normaliseStoreInput } from "@/lib/preview/store-url";
import { signPreviewToken } from "@/lib/preview/token";
import type { TrialLeadResponse } from "@/lib/preview/types";

/* Deliberately loose. A marketing form should reject the obvious typo and
   nothing else — RFC-shaped regexes turn away real addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Lead = {
  email: string;
  /** Which CTA it came from, so we can tell the pages apart. */
  source: string;
  /** The store they typed, when the form asked for one. */
  store?: string;
  at: string;
};

/**
 * A stable, non-identifying handle for one address, so two log lines can be tied
 * together without the address being in either of them. Truncated because this
 * is for reading logs, not for looking anyone up.
 */
function reference(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}

async function recordLead(lead: Lead): Promise<void> {
  /* The lead goes to the destination whole; the log gets the reference only. */
  console.info(
    `[trial-lead] captured (mock — not stored) ref=${reference(lead.email)} source=${lead.source} store=${lead.store ?? "-"}`,
  );
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

  try {
    await recordLead({
      email: email.trim().toLowerCase(),
      source: typeof source === "string" ? source.slice(0, 64) : "unknown",
      ...(host ? { store: host } : {}),
      at: new Date().toISOString(),
    });
  } catch (err) {
    /* Swallowed on purpose. Losing a lead is our problem to find in the logs;
       it is not a reason to hold the demo shut on the visitor, who has already
       done the thing we asked. The client shows the password either way. */
    console.error("[trial-lead] could not record lead:", err);
  }

  const response: TrialLeadResponse =
    host ? { ok: true, store: host, token: signPreviewToken(host) } : { ok: true };
  return Response.json(response);
}
