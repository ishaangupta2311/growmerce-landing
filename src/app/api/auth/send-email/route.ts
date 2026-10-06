/**
 * Where Supabase Auth sends every email it would otherwise have sent itself.
 *
 * This is the project's Send Email hook (Authentication → Hooks in the Supabase
 * dashboard). With it on, a new affiliate's confirmation and the "forgot
 * password" link stop arriving from Supabase's shared sender in its stock
 * template: Supabase POSTs the recipient and the one-time token here, and the
 * email is written by `src/lib/email/auth-email.ts` and sent through the same
 * Resend account the Growsearch app uses, from our own domain.
 *
 * Server-to-server only, and authenticated by the hook's signature; see
 * `src/lib/supabase/send-email-hook.ts`.
 *
 * The answer matters, because Supabase acts on it. A 2xx means the email is on
 * its way, and the sign-up form goes on to say "check your email". Anything
 * else fails the sign-up or reset that asked for it — which is the right
 * outcome for an email that did not go: the person is told to try again,
 * instead of being left waiting on an inbox nothing is coming to. So nothing
 * here answers 200 for a message it did not hand to Resend.
 */

import { renderAuthEmail } from "@/lib/email/auth-email";
import { sendEmail } from "@/lib/email/resend";
import { parseHook, verifyHook } from "@/lib/supabase/send-email-hook";

/** A hook body is one user and one token. Larger than this is a mistake. */
const MAX_BODY_BYTES = 64 * 1024;

/**
 * The shape Supabase expects a hook's refusal in. The message can reach the
 * person at the form, so it is written for them; the reason goes to the log.
 */
function refuse(status: number, message: string) {
  return Response.json({ error: { http_code: status, message } }, { status });
}

const COULD_NOT_SEND = "We could not send that email just now. Please try again in a moment.";

export async function POST(request: Request) {
  /* Read as text, once, and verify against exactly these bytes. */
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return refuse(413, "Request body too large.");

  const signature = verifyHook(request, raw);
  if (!signature.ok) {
    console.warn(`[auth-email] rejected a hook request — ${signature.reason}`);
    return signature.reason === "not_configured"
      ? refuse(503, COULD_NOT_SEND)
      : refuse(401, "Unauthorized.");
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return refuse(400, "Invalid JSON.");
  }

  const parsed = parseHook(body);
  if (!parsed.ok) {
    console.error(`[auth-email] cannot send — ${parsed.reason}: ${parsed.detail}`);
    return refuse(parsed.reason === "unsupported" ? 422 : 400, COULD_NOT_SEND);
  }

  const email = renderAuthEmail(parsed.request);
  if (!email) {
    console.error(`[auth-email] cannot send ${parsed.request.action} — no usable redirect or site URL`);
    return refuse(422, COULD_NOT_SEND);
  }

  /* Keyed on the webhook id, which Supabase repeats when it retries a hook, so
     a retry of a send that did land is not a second email. */
  const sent = await sendEmail({
    to: parsed.request.to,
    ...email,
    idempotencyKey: `auth-email/${signature.id}`,
  });

  if (!sent.ok) {
    console.error(`[auth-email] ${parsed.request.action} not sent — ${sent.reason}: ${sent.detail}`);
    return refuse(sent.reason === "not_configured" ? 503 : 502, COULD_NOT_SEND);
  }

  console.info(`[auth-email] sent ${parsed.request.action} — ${sent.id ?? "no id"}`);
  return Response.json({});
}
