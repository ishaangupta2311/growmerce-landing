"use client";

import Link from "next/link";
import { useActionState } from "react";

import { resetPassword, type FormState } from "@/app/affiliates/actions";

import { Field } from "../Field";
import FormBanner from "../FormBanner";
import Submit from "../Submit";

/**
 * Choosing a new password.
 *
 * Twice, and compared on the server. A single field plus a "show password"
 * toggle is the fashionable answer, but the failure it prevents is the
 * expensive one here: a typo in a password set from a link that has now been
 * spent locks the partner out of an account with their earnings in it, and the
 * only way back is another email.
 */
export default function ResetForm() {
  const [state, action] = useActionState<FormState, FormData>(resetPassword, undefined);

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <Field
        name="password"
        label="New password"
        type="password"
        required
        autoComplete="new-password"
        hint="At least 8 characters."
      />
      <Field
        name="confirm"
        label="New password again"
        type="password"
        required
        autoComplete="new-password"
      />

      <Submit pendingLabel="Saving…">Set my new password</Submit>

      <p className="text-center text-[14.5px] text-body-mute">
        <Link href="/affiliates/forgot" className="font-bold text-brand underline">
          Send myself a new link
        </Link>
      </p>
    </form>
  );
}
