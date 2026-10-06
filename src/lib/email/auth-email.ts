import "server-only";

import type { AuthEmailAction, AuthEmailRequest } from "@/lib/supabase/send-email-hook";

/**
 * The emails behind signing in: confirming a new affiliate's address, and the
 * reset link behind "forgot password". Supabase Auth decides when one is due
 * and mints the token; what it says and how it looks is decided here.
 *
 * Each email is a subject, a heading, some paragraphs and one button, and the
 * HTML and plain-text bodies are both built from that so the two cannot drift
 * apart. The markup is tables and inline styles because that is what mail
 * clients render: no stylesheet, no web font, nothing that needs a `<head>`.
 */

/** Where every emailed link lands. See `src/app/affiliates/auth/callback/route.ts`. */
const CALLBACK_PATH = "/affiliates/auth/callback";

/**
 * Production, whatever deployment is sending. A mail client fetches this from
 * the open internet, so a preview or localhost origin would show a broken image.
 */
const LOGO_URL = "https://growmerce.ai/brand/logo.png";

/* The site's palette, from `src/app/globals.css`. */
const BRAND = "#ff5a1f";
const CHARCOAL = "#171717";
const CREAM = "#fff4ee";
const BODY = "#4a4a4a";
const MUTED = "#8a8a8a";
const LINE = "#e5e5e5";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

type Copy = {
  subject: string;
  /** The line an inbox shows after the subject. */
  preview: string;
  heading: string;
  paragraphs: string[];
  cta: string;
  /** What to do if this email was not asked for. */
  footnote: string;
  /** Where the link goes when the request did not say. */
  next?: string;
};

const COPY: Record<AuthEmailAction, (request: AuthEmailRequest) => Copy> = {
  signup: ({ kind }) => {
    const as = kind === "agency" ? " as an agency" : kind === "influencer" ? " as a creator" : "";
    return {
      subject: "Confirm your email to finish your Growmerce application",
      preview: "One click, and you are on the last step of your application.",
      heading: "Confirm your email address",
      paragraphs: [
        `Thanks for applying to the Growmerce affiliate program${as}.`,
        "Confirm this address and you will go straight to the last step of your application. We read every application by hand, so you will hear back from a person.",
      ],
      cta: "Confirm email address",
      footnote:
        "If you did not apply to the Growmerce affiliate program, you can ignore this email. Nothing happens until the address is confirmed.",
    };
  },
  recovery: () => ({
    subject: "Reset your Growmerce password",
    preview: "The link is good for one hour and can only be used once.",
    heading: "Reset your password",
    paragraphs: [
      "We received a request to reset the password on your Growmerce account.",
      "The link below is good for one hour and can only be used once.",
    ],
    cta: "Choose a new password",
    footnote: "If you did not ask for this, you can ignore this email. Your password stays as it is.",
  }),
  /* An invited account has no password yet, so the link ends on the page that
     sets one. */
  invite: () => ({
    subject: "You have been invited to Growmerce",
    preview: "Accept the invitation and choose a password.",
    heading: "You have been invited",
    paragraphs: [
      "An account has been set up for you on Growmerce. Accept the invitation to choose a password and sign in.",
    ],
    cta: "Accept the invitation",
    footnote: "If you were not expecting this, you can ignore this email.",
    next: "/affiliates/reset",
  }),
  magiclink: () => ({
    subject: "Your Growmerce sign-in link",
    preview: "The link signs you in and can only be used once.",
    heading: "Sign in to Growmerce",
    paragraphs: ["Use the link below to sign in. It can only be used once."],
    cta: "Sign in",
    footnote: "If you did not ask to sign in, you can ignore this email.",
  }),
};

function parseUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

/**
 * The link in the email: our own callback, carrying the token for it to verify.
 *
 * Supabase's stock link goes to its own `/auth/v1/verify` and bounces back,
 * which puts a `supabase.co` address under a button in an email from us. The
 * callback already accepts `token_hash` and `type` directly, so the link can be
 * on the domain the email came from.
 *
 * The origin is the one the request came from: `redirect_to` is what the
 * sign-up or reset form passed, already checked by Supabase against the
 * project's redirect allow-list, and it is how a preview deployment gets links
 * back to itself. When Supabase did not accept it, it sends its Site URL in
 * that field, with no path — which is why the path is ours, not the field's.
 * `next` is carried over, and the callback applies `safeNext` to it.
 */
export function confirmationLink(request: AuthEmailRequest, fallbackNext?: string): string | null {
  const asked = parseUrl(request.redirectTo);
  const base = asked ?? parseUrl(request.siteUrl);
  if (!base) return null;

  const link = new URL(CALLBACK_PATH, base.origin);
  link.searchParams.set("token_hash", request.tokenHash);
  link.searchParams.set("type", request.action);

  const next = asked?.searchParams.get("next") ?? fallbackNext;
  if (next) link.searchParams.set("next", next);

  return link.toString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A first name to greet, or nothing.
 *
 * It is whatever was typed into the sign-up form by somebody who has not yet
 * proved the address is theirs, so it is cut to one short word and escaped
 * before it goes anywhere near the HTML.
 */
function firstName(name: string | null): string | null {
  const word = name?.split(/\s+/)[0]?.replace(/[^\p{L}\p{M}'-]/gu, "").slice(0, 40);
  return word || null;
}

export type RenderedEmail = { subject: string; html: string; text: string };

/** Null when the request carries no origin a link could be built on. */
export function renderAuthEmail(request: AuthEmailRequest): RenderedEmail | null {
  const copy = COPY[request.action](request);
  const link = confirmationLink(request, copy.next);
  if (!link) return null;

  const name = firstName(request.name);
  const greeting = name ? `Hi ${name},` : "Hi,";
  const href = escapeHtml(link);

  const text = [
    greeting,
    ...copy.paragraphs,
    `${copy.cta}: ${link}`,
    copy.footnote,
    "The Growmerce team\nhttps://growmerce.ai",
  ].join("\n\n");

  const paragraph = (line: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:${BODY}">${escapeHtml(line)}</p>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CREAM}">${escapeHtml(copy.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM}">
<tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
<tr><td style="padding:0 8px 24px">
<a href="https://growmerce.ai" style="text-decoration:none"><img src="${LOGO_URL}" width="148" height="32" alt="Growmerce" style="display:block;border:0;height:32px;width:148px"></a>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:16px;padding:40px 36px;font-family:${FONT}">
<h1 style="margin:0 0 20px;font-size:24px;line-height:32px;font-weight:700;letter-spacing:-0.01em;color:${CHARCOAL}">${escapeHtml(copy.heading)}</h1>
${paragraph(greeting)}
${copy.paragraphs.map(paragraph).join("\n")}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0">
<tr><td bgcolor="${BRAND}" style="border-radius:999px">
<a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${escapeHtml(copy.cta)}</a>
</td></tr>
</table>
<p style="margin:0 0 8px;font-size:13px;line-height:20px;color:${MUTED}">If the button does not work, copy this link into your browser:</p>
<p style="margin:0;font-size:13px;line-height:20px;word-break:break-all"><a href="${href}" style="color:${BRAND}">${href}</a></p>
<hr style="border:none;border-top:1px solid ${LINE};margin:28px 0 20px">
<p style="margin:0;font-size:13px;line-height:20px;color:${MUTED}">${escapeHtml(copy.footnote)}</p>
</td></tr>
<tr><td style="padding:24px 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED}">
The Growmerce team &middot; <a href="https://growmerce.ai" style="color:${MUTED}">growmerce.ai</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: copy.subject, html, text };
}
