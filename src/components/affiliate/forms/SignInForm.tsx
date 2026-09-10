"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signIn, type FormState } from "@/app/affiliates/actions";

import { Field } from "../Field";
import FormBanner from "../FormBanner";
import Submit from "../Submit";

/**
 * `next` rides through as a hidden field so that signing in returns somebody to
 * the page they were trying to reach. It is validated again in the action —
 * a hidden field is a value the browser was told to send, not a value we know
 * to be ours.
 */
export default function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, undefined);

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      {next && <input type="hidden" name="next" value={next} />}

      <Field name="email" label="Email" type="email" required autoComplete="email" />
      <Field
        name="password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
      />

      <Submit pendingLabel="Signing you in…">Sign in</Submit>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[14.5px] text-body-mute">
        <Link href="/affiliates/forgot" className="font-bold text-brand underline">
          Forgot your password?
        </Link>
        <span>
          No account?{" "}
          <Link href="/affiliates/signup" className="font-bold text-brand underline">
            Apply
          </Link>
        </span>
      </div>
    </form>
  );
}
