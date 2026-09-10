"use client";

import { useActionState } from "react";

import { completeApplication, type FormState } from "@/app/affiliates/actions";

import { Field, KindChoice } from "../Field";
import FormBanner from "../FormBanner";
import Submit from "../Submit";

/**
 * The second half of joining, shown to anyone signed in who has no partner
 * record yet.
 *
 * The defaults come from what they typed at sign-up, carried on the auth user's
 * metadata — so the usual path through this page is reading four filled-in
 * fields and pressing the button. It is a form rather than an automatic
 * redirect because the other path through it is somebody confirming an email
 * three days later, who deserves to see what they are agreeing to.
 */
export default function ApplyForm({
  defaults,
}: {
  defaults: { name: string; kind: string; company: string; website: string };
}) {
  const [state, action] = useActionState<FormState, FormData>(completeApplication, undefined);

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <KindChoice defaultValue={defaults.kind} />

      <Field name="name" label="Your name" required defaultValue={defaults.name} />
      <Field name="company" label="Agency or channel" required defaultValue={defaults.company} />
      <Field name="website" label="Website or channel link" type="url" defaultValue={defaults.website} />

      <Submit pendingLabel="Setting things up…">Finish and open my dashboard</Submit>
    </form>
  );
}
