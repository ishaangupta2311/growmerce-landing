import "server-only";

import type { AuthEmailAction, AuthEmailRequest } from "@/lib/supabase/send-email-hook";
import { renderLayout, type EmailCopy, type RenderedEmail } from "./layout";

/**
 * The emails behind signing in: confirming a new affiliate's address, and the
 * reset link behind "forgot password". Supabase Auth decides when one is due
 * and mints the token; what it says and how it looks is decided here.
 *
 * Each email is a subject, a heading, some paragraphs and one button; how that
 * is drawn is `./layout.ts`, shared with the other email this site sends.
 */

/** Where every emailed link lands. See `src/app/affiliates/auth/callback/route.ts`. */
const CALLBACK_PATH = "/affiliates/auth/callback";

type Copy = EmailCopy & {
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

/** Null when the request carries no origin a link could be built on. */
export function renderAuthEmail(request: AuthEmailRequest): RenderedEmail | null {
  const copy = COPY[request.action](request);
  const link = confirmationLink(request, copy.next);
  if (!link) return null;

  return renderLayout({ ...copy, name: request.name, link });
}
