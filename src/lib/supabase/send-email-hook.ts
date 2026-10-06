import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Proving that a "send this email" request really came from Supabase Auth.
 *
 * With the Send Email hook switched on, Supabase stops mailing anything itself
 * and POSTs here instead: who the email is for, and the one-time token that
 * goes in it. That body is a login for somebody's account, and the endpoint
 * that receives it sends mail in our name, so an unsigned request gets nothing.
 *
 * Supabase signs to the Standard Webhooks spec, not the scheme the affiliate
 * ingest uses: three headers, an HMAC-SHA256 of `id.timestamp.body` under a
 * base64 secret, the digest in base64. The secret is shown once in the
 * dashboard as `v1,whsec_<base64>` and is stored here exactly as shown.
 */

/** Same window, and the same reasoning, as `src/lib/affiliate/signature.ts`. */
const MAX_SKEW_SECONDS = 5 * 60;

export type HookFailure =
  | "not_configured" // no hook secret on this deployment
  | "missing" // one of the three headers absent
  | "malformed" // a header present but not in the expected shape
  | "stale" // timestamp outside the window
  | "mismatch"; // no offered signature verified

export type HookCheck = { ok: true; id: string } | { ok: false; reason: HookFailure };

function secret(): Buffer | null {
  const value = process.env.SEND_EMAIL_HOOK_SECRET?.trim();
  if (!value) return null;

  const key = Buffer.from(value.replace(/^v1,/, "").replace(/^whsec_/, ""), "base64");
  return key.length > 0 ? key : null;
}

/** The signature Supabase computes, for the verifier below and the tests. */
export function signHook(id: string, timestamp: number, body: string, key: Buffer): string {
  return createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
}

/**
 * Whether this request is genuinely from Supabase.
 *
 * `rawBody` must be the exact text read off the request. `not_configured` is
 * not a pass: a deployment that cannot authenticate the sender answers nobody.
 */
export function verifyHook(request: Request, rawBody: string): HookCheck {
  const key = secret();
  if (!key) return { ok: false, reason: "not_configured" };

  const id = request.headers.get("webhook-id");
  const stamp = request.headers.get("webhook-timestamp");
  const header = request.headers.get("webhook-signature");
  if (!id || !stamp || !header) return { ok: false, reason: "missing" };

  /* Seconds, not the milliseconds the affiliate scheme sends. */
  const timestamp = Number(stamp);
  if (!Number.isSafeInteger(timestamp)) return { ok: false, reason: "malformed" };
  if (Math.abs(Date.now() / 1000 - timestamp) > MAX_SKEW_SECONDS) {
    return { ok: false, reason: "stale" };
  }

  const expected = Buffer.from(signHook(id, timestamp, rawBody, key), "base64");

  /* The header is a space-separated list of `version,signature`, so a secret
     can be rotated without a window in which nothing verifies. */
  for (const entry of header.split(" ")) {
    const [version, offered] = entry.split(",");
    if (version !== "v1" || !offered) continue;

    const candidate = Buffer.from(offered, "base64");
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) {
      return { ok: true, id };
    }
  }
  return { ok: false, reason: "mismatch" };
}

/** The four emails this site has a use for. See `src/lib/email/auth-email.ts`. */
export type AuthEmailAction = "signup" | "recovery" | "invite" | "magiclink";

const ACTIONS: readonly AuthEmailAction[] = ["signup", "recovery", "invite", "magiclink"];

export type AuthEmailRequest = {
  action: AuthEmailAction;
  to: string;
  tokenHash: string;
  /** Where the sign-up or reset form asked the link to land, if it said. */
  redirectTo: string | null;
  /** The project's Site URL, which Supabase falls back to. */
  siteUrl: string | null;
  /** What the sign-up form stored on the user. Untrusted, display only. */
  name: string | null;
  kind: "agency" | "influencer" | null;
};

export type ParsedHook =
  | { ok: true; request: AuthEmailRequest }
  | { ok: false; reason: "invalid" | "unsupported"; detail: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

/**
 * Reads the hook body down to what an email needs.
 *
 * An action outside the four is reported, not skipped. Answering 200 to an
 * email we did not send would have Supabase tell the person to check an inbox
 * nothing is coming to; refusing makes the operation that asked for it fail
 * where somebody will see it.
 */
export function parseHook(body: unknown): ParsedHook {
  const user = record(record(body).user);
  const data = record(record(body).email_data);
  const metadata = record(user.user_metadata);

  const action = str(data.email_action_type);
  const to = str(user.email);
  const tokenHash = str(data.token_hash);
  if (!action || !to || !tokenHash) {
    return { ok: false, reason: "invalid", detail: "no action, address or token" };
  }
  if (!ACTIONS.includes(action as AuthEmailAction)) {
    return { ok: false, reason: "unsupported", detail: action.slice(0, 40) };
  }

  const kind = str(metadata.affiliate_kind);
  return {
    ok: true,
    request: {
      action: action as AuthEmailAction,
      to,
      tokenHash,
      redirectTo: str(data.redirect_to),
      siteUrl: str(data.site_url),
      name: str(metadata.affiliate_name),
      kind: kind === "agency" || kind === "influencer" ? kind : null,
    },
  };
}
