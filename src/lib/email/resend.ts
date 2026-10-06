import "server-only";

/**
 * The one place this site hands a message to Resend.
 *
 * The same account, verified domain and variable names the Growsearch app
 * sends its merchant email with (`app/merchant-email.server.js` there), so the
 * two deployments are configured the same way: `RESEND_API_KEY`, `EMAIL_FROM`
 * and, optionally, `EMAIL_REPLY_TO`.
 *
 * Failures come back as values. The caller is a webhook with a few seconds to
 * answer, and what it does about a message that did not go is its decision.
 * Nothing here logs the recipient: an address belongs in the `to` field and in
 * no log line.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Supabase gives an auth hook five seconds in total, and a hook that times out
 * fails the sign-up it was called for. Four leaves room to answer.
 */
const RESEND_TIMEOUT_MS = 4_000;

export type EmailConfig = {
  apiKey: string;
  /** `Name <address@verified-domain>`. The domain must be verified in Resend. */
  from: string;
  replyTo: string | null;
};

export function emailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;

  return { apiKey, from, replyTo: process.env.EMAIL_REPLY_TO?.trim() || null };
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Makes a retried send a no-op at Resend rather than a second email. */
  idempotencyKey?: string;
};

export type SendOutcome =
  | { ok: true; id: string | null }
  | { ok: false; reason: "not_configured" | "unreachable" | "rejected"; detail: string };

export async function sendEmail(message: OutgoingEmail): Promise<SendOutcome> {
  const config = emailConfig();
  if (!config) {
    return { ok: false, reason: "not_configured", detail: "RESEND_API_KEY or EMAIL_FROM is unset" };
  }

  let response: Response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(config.replyTo ? { reply_to: config.replyTo } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
  } catch (err) {
    const why = err instanceof Error ? err.name : "unknown";
    return { ok: false, reason: "unreachable", detail: why };
  }

  const body = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!response.ok) {
    return {
      ok: false,
      reason: "rejected",
      detail: `${response.status}: ${(body?.message ?? "no detail").slice(0, 160)}`,
    };
  }
  return { ok: true, id: body?.id ?? null };
}
