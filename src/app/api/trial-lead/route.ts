/**
 * Lead capture behind the demo-store gate and the "Try it free" form.
 *
 * MOCK. No email platform is wired up yet, so a captured address is validated
 * and written to the server log and nowhere else. The flow in front of it is
 * real — the visitor is gated on entering an address either way — but nothing
 * here persists it, so treat leads taken before this is wired as lost.
 *
 * It also issues the preview token. `store` is optional: the "See demo" gate
 * sends an email and nothing else, and must keep working exactly as it did.
 * When a store is supplied it comes back normalised, with a signed 15-minute
 * token that /api/preview requires before it will touch the network. The token
 * is bound to the store, not to the person — it carries nothing about the lead.
 *
 * To make it real, replace the body of `recordLead` with the call to whatever
 * platform you land on (Omnisend, Klaviyo, HubSpot, a Sheet, a database).
 * That function is the only thing that needs to change; the validation, the
 * shape of a lead and the client are all independent of the destination.
 */

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

async function recordLead(lead: Lead): Promise<void> {
  console.info("[trial-lead] captured (mock — not stored):", lead);
}

export async function POST(request: Request) {
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
