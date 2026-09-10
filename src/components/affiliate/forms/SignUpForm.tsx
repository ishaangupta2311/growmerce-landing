"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUp, type FormState } from "@/app/affiliates/actions";

import { Field, KindChoice } from "../Field";
import FormBanner from "../FormBanner";
import Submit from "../Submit";

/**
 * The application form.
 *
 * `useActionState` keeps the typed values on the page when the action comes
 * back with a complaint — the alternative, a redirect to an error page, throws
 * away a filled-in form to tell somebody their password was too short.
 *
 * When the action returns a `notice` rather than an error it is the
 * confirmation email, and the form is replaced by it: leaving a live "Create
 * account" button under "check your email" invites a second submission that
 * Supabase will reject as already registered.
 */
export default function SignUpForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, undefined);

  if (state?.notice) {
    return (
      <div className="space-y-4">
        <FormBanner state={state} />
        <p className="text-[15px] leading-relaxed text-body-mute">
          Nothing arrived? It can take a minute, and it sometimes lands in spam.
          You can{" "}
          <Link href="/affiliates/login" className="font-bold text-brand underline">
            sign in
          </Link>{" "}
          once you have clicked the link.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <KindChoice />

      <Field
        name="name"
        label="Your name"
        required
        autoComplete="name"
        placeholder="Priya Raman"
        hint="Who a payout is made out to."
      />
      <Field
        name="company"
        label="Agency or channel"
        required
        autoComplete="organization"
        placeholder="Northlight Studio"
        hint="What we are approving. Your own name is fine if you work alone."
      />
      <Field
        name="website"
        label="Website or channel link"
        type="url"
        placeholder="https://"
        hint="Helps us approve you faster. We look at every application by hand."
      />
      <Field
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@studio.com"
      />
      <Field
        name="password"
        label="Password"
        type="password"
        required
        autoComplete="new-password"
        hint="At least 8 characters."
      />

      <Submit pendingLabel="Creating your account…">Create my account</Submit>

      <p className="text-center text-[14.5px] text-body-mute">
        Already applied?{" "}
        <Link href="/affiliates/login" className="font-bold text-brand underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
