"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset, type FormState } from "@/app/affiliates/actions";

import { Field } from "../Field";
import FormBanner from "../FormBanner";
import Submit from "../Submit";

export default function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, undefined);

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <Field name="email" label="Email" type="email" required autoComplete="email" />

      <Submit pendingLabel="Sending…">Email me a reset link</Submit>

      <p className="text-center text-[14.5px] text-body-mute">
        <Link href="/affiliates/login" className="font-bold text-brand underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
