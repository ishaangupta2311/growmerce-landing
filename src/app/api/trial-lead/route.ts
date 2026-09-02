/**
 * Lead capture behind the "Try it free" demo-store gate.
 *
 * There is no database on this site, so the handler validates the address and
 * hands it to whatever is configured to receive leads — set
 * `TRIAL_LEAD_WEBHOOK_URL` to a CRM/ESP/Zapier endpoint. With nothing
 * configured it logs the lead server-side, which is enough to run the flow in
 * development without pretending the address was stored anywhere.
 */

/* Deliberately loose. A marketing form should reject the obvious typo and
   nothing else — RFC-shaped regexes turn away real addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Lead = { email: string; source: string; at: string };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { email, source } = (body ?? {}) as { email?: unknown; source?: unknown };

  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const lead: Lead = {
    email: email.trim().toLowerCase(),
    source: typeof source === "string" ? source.slice(0, 64) : "unknown",
    at: new Date().toISOString(),
  };

  const webhook = process.env.TRIAL_LEAD_WEBHOOK_URL;
  if (!webhook) {
    console.info("[trial-lead] no TRIAL_LEAD_WEBHOOK_URL configured:", lead);
    return Response.json({ ok: true, delivered: false });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
      /* The visitor is waiting on this to see the password. A webhook that
         hangs must not hold the door shut. */
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
  } catch (err) {
    /* Swallowed on purpose: losing the lead is our problem, not the
       visitor's, and the client shows the password either way. */
    console.error("[trial-lead] delivery failed:", err, lead);
    return Response.json({ ok: true, delivered: false });
  }

  return Response.json({ ok: true, delivered: true });
}
