"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createPartner, updatePartnerProfile, updatePayoutPreferences } from "@/lib/affiliate/store";
import { requirePartner } from "@/lib/affiliate/session";
import type { PartnerKind, PayoutMethod } from "@/lib/affiliate/types";
import { supabaseServer, currentUser } from "@/lib/supabase/server";

/**
 * Everything the affiliate surface does that changes something.
 *
 * Two rules hold for every function in this file.
 *
 * **A Server Action is a public POST endpoint.** It is reachable directly, not
 * only through the form that renders it, so each one re-establishes who is
 * asking rather than trusting an argument. That is why nothing here takes a
 * `partnerId`: the ones that need a partner call `requirePartner()`, which is
 * the same check the pages use.
 *
 * **Failures come back as values, not exceptions.** These are all bound to
 * `useActionState`, so a returned `{ error }` re-renders the form with the
 * message beside the field. A thrown error would replace the page with the
 * error boundary and lose what the person typed.
 */

export type FormState = { error?: string; notice?: string } | undefined;

/* Deliberately loose, and the same rule the trial form uses. A sign-up form
   should reject the obvious typo and nothing else — RFC-shaped regexes turn
   away real addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Supabase's own floor is six characters. Eight is not much better against a
 * determined attacker, but this account can see what an agency's whole client
 * book pays us, and six is not a defensible number to have chosen.
 */
const MIN_PASSWORD = 8;

/**
 * One message, three forms.
 *
 * `company` is not decoration: it is what an approval is actually granted to,
 * and the only field that distinguishes "Priya Raman" from the studio whose
 * client sites are about to carry her code. A blank one costs us an email
 * before we can act on the application, so the form asks now.
 *
 * Sole traders whose agency name is their own name type it twice, which is a
 * fair price for never having to ask anybody else.
 */
const COMPANY_MISSING = "Tell us the agency or channel you are applying as.";

function text(form: FormData, field: string, max = 200): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Empty optional fields are null in the database, never `""`. */
function optionalText(form: FormData, field: string, max = 200): string | null {
  return text(form, field, max) || null;
}

/**
 * The site's own origin, for the links Supabase emails out.
 *
 * Read from the request rather than hard-coded so a preview deployment mails
 * links back to itself instead of to production, where the recovery token would
 * be spent against the wrong database.
 */
async function origin(): Promise<string> {
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host");
  const proto = store.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://growmerce.ai";
}

/* ---------------------------------------------------------------------------
   Joining
--------------------------------------------------------------------------- */

/**
 * Creates the login, and nothing else.
 *
 * The partner record is *not* written here, and that is deliberate. Most
 * Supabase projects require an emailed confirmation, so `signUp` usually
 * returns no session — there is no authenticated user to own a partner row yet,
 * and writing one from an unconfirmed address would let anyone create accounts
 * in someone else's name. What the application details do instead is ride along
 * in the user's metadata, and `/affiliates/apply` turns them into a partner the
 * first time the person is actually signed in.
 *
 * That path also covers the project where confirmation is switched off: the
 * session comes back immediately, the redirect lands on `/affiliates/apply`,
 * and the form there is already filled in.
 */
export async function signUp(_state: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 254).toLowerCase();
  const password = text(form, "password", 200);
  const name = text(form, "name", 120);
  const company = text(form, "company", 160);
  const kind = text(form, "kind") as PartnerKind;

  if (!name) return { error: "Tell us who we are paying." };
  if (!company) return { error: COMPANY_MISSING };
  if (!EMAIL.test(email)) return { error: "That email address does not look right." };
  if (password.length < MIN_PASSWORD) {
    return { error: `Use at least ${MIN_PASSWORD} characters for your password.` };
  }
  if (kind !== "agency" && kind !== "influencer") {
    return { error: "Choose whether you are joining as an agency or a creator." };
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await origin()}/affiliates/auth/callback`,
      /* Carried on the auth user until `/affiliates/apply` reads it back. None
         of it is trusted for anything but pre-filling that form — the partner
         row is written from what the signed-in person confirms there. */
      data: {
        affiliate_name: name,
        affiliate_kind: kind,
        affiliate_company: company,
        affiliate_website: optionalText(form, "website", 200),
      },
    },
  });

  if (error) {
    /* Supabase distinguishes "already registered" from the rest, and so should
       we: the recovery is a different page. It does not leak whether the
       address exists, because Supabase's own sign-up flow says the same thing
       to anybody who tries. */
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "That address already has an account. Sign in instead, or reset your password." };
    }
    return { error: error.message };
  }

  if (!data.session) {
    return {
      notice:
        "Check your email — we have sent a link to confirm the address. Your dashboard is waiting behind it.",
    };
  }

  redirect("/affiliates/apply");
}

/**
 * Turns a confirmed login into a partner account.
 *
 * Separate from `signUp` because this is the first point at which we have an
 * authenticated person: `requirePartner()` sends anyone signed in without a
 * partner row here, whether they arrived from the sign-up form five seconds ago
 * or from a confirmation email three days later.
 */
export async function completeApplication(_state: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/affiliates/login");

  const name = text(form, "name", 120);
  const company = text(form, "company", 160);
  const kind = text(form, "kind") as PartnerKind;

  if (!name) return { error: "Tell us who we are paying." };
  if (!company) return { error: COMPANY_MISSING };
  if (kind !== "agency" && kind !== "influencer") {
    return { error: "Choose whether you are joining as an agency or a creator." };
  }

  try {
    await createPartner({
      userId: user.id,
      kind,
      name,
      company,
      /* The address on the login, not one typed into this form. It is the one
         we have proof of, and it is where a payout question will be sent. */
      email: user.email ?? "",
      website: optionalText(form, "website", 200),
    });
  } catch (err) {
    /* A second submission — a double-clicked button, a back-button replay —
       hits the unique index on user_id. They have an account; show it to them
       rather than an error about a constraint. */
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "23505") {
      redirect("/affiliates/dashboard");
    }
    const why = err instanceof Error ? err.message : String(err);
    console.error(`[affiliate] could not create partner — ${why.slice(0, 200)}`);
    return { error: "We could not set your account up just now. Please try again in a moment." };
  }

  redirect("/affiliates/dashboard");
}

/* ---------------------------------------------------------------------------
   Signing in and out
--------------------------------------------------------------------------- */

export async function signIn(_state: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 254).toLowerCase();
  const password = text(form, "password", 200);

  if (!EMAIL.test(email) || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    /* One message for a wrong password and for an address that has no account.
       Telling them apart turns this form into a way to test whether a given
       agency has signed up with us. */
    return { error: "That email and password do not match an account." };
  }

  redirect(safeNext(text(form, "next", 300)));
}

/**
 * Where to land after signing in.
 *
 * `next` originates in `src/proxy.ts`, which puts the path somebody was trying
 * to reach into the login URL — but by the time it arrives here it is a form
 * field, and a form field is whatever the browser was told to send. Restricting
 * it to a path inside `/affiliates/` is what stops a crafted login link from
 * signing a partner in and then depositing them somewhere else entirely. The
 * `//` case is the one worth naming: `//evil.example` is a protocol-relative
 * URL, and `startsWith("/")` alone waves it through.
 */
function safeNext(raw: string): string {
  if (!raw || raw.startsWith("//") || !raw.startsWith("/affiliates/")) {
    return "/affiliates/dashboard";
  }
  return raw;
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/affiliates/login");
}

/**
 * Sends a reset link.
 *
 * Always reports success, whatever happened. The alternative tells anyone who
 * asks whether an address is registered, and the people most likely to ask are
 * not the people who forgot their password.
 */
export async function requestPasswordReset(_state: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 254).toLowerCase();
  if (!EMAIL.test(email)) return { error: "That email address does not look right." };

  const supabase = await supabaseServer();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/affiliates/auth/callback?next=/affiliates/reset`,
  });

  return {
    notice: "If that address has an account, a reset link is on its way. It is good for one hour.",
  };
}

/**
 * Sets a new password for whoever is holding a recovery session.
 *
 * There is no "current password" field and there should not be: the person
 * arrives here from an emailed link precisely because they do not know it. What
 * stands in for it is the session — `/affiliates/auth/callback` exchanged the
 * one-time token for one, so being signed in *is* the proof that they control
 * the address.
 *
 * Which is also why an expired link has to be reported as an expired link. The
 * cookies are simply absent, and "we could not save that" would send somebody
 * to try a different password when what they need is a fresh email.
 */
export async function resetPassword(_state: FormState, form: FormData): Promise<FormState> {
  const password = text(form, "password", 200);
  const confirm = text(form, "confirm", 200);

  if (password.length < MIN_PASSWORD) {
    return { error: `Use at least ${MIN_PASSWORD} characters.` };
  }
  if (password !== confirm) {
    return { error: "Those two passwords do not match." };
  }

  const supabase = await supabaseServer();
  const { data, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !data.user) {
    return {
      error: "That reset link has expired or has already been used. Ask for a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/affiliates/dashboard");
}

/* ---------------------------------------------------------------------------
   Settings
--------------------------------------------------------------------------- */

export async function saveProfile(_state: FormState, form: FormData): Promise<FormState> {
  const { partner } = await requirePartner();

  const name = text(form, "name", 120);
  if (!name) return { error: "A name is required — it is what a payout is made out to." };

  const company = text(form, "company", 160);
  if (!company) return { error: COMPANY_MISSING };

  await updatePartnerProfile(partner.id, {
    name,
    company,
    website: optionalText(form, "website", 200),
  });

  revalidatePath("/affiliates/dashboard/settings");
  return { notice: "Saved." };
}

const METHODS: readonly PayoutMethod[] = ["bank", "paypal", "wise", "other"];

export async function savePayoutPreferences(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const { partner } = await requirePartner();

  const method = text(form, "method") as PayoutMethod;
  if (!METHODS.includes(method)) return { error: "Choose how you would like to be paid." };

  /* Longer than a name because a bank field is an IBAN, a sort code, an account
     number and a reference, and people paste all four. */
  const details = text(form, "details", 600);
  if (!details) {
    return { error: "We need somewhere to send the money — an account number or a PayPal address." };
  }

  const currency = text(form, "currency", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Choose a payout currency." };

  await updatePayoutPreferences(partner.id, { method, details, currency });

  revalidatePath("/affiliates/dashboard/settings");
  return { notice: "Payout details saved." };
}
