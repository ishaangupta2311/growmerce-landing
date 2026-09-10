"use client";

import { useActionState } from "react";

import { saveProfile, savePayoutPreferences, type FormState } from "@/app/affiliates/actions";
import type { Partner } from "@/lib/affiliate/types";

import { Field, Select, TextArea } from "../Field";
import FormBanner from "../FormBanner";
import Submit from "../Submit";

export function ProfileForm({ partner }: { partner: Partner }) {
  const [state, action] = useActionState<FormState, FormData>(saveProfile, undefined);

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <Field name="name" label="Your name" required defaultValue={partner.name} />
      <Field name="company" label="Agency or channel" required defaultValue={partner.company} />
      <Field
        name="website"
        label="Website or channel link"
        type="url"
        defaultValue={partner.website ?? ""}
      />

      <div className="sm:max-w-[220px]">
        <Submit pendingLabel="Saving…" variant="secondary">
          Save
        </Submit>
      </div>
    </form>
  );
}

/**
 * How the partner gets paid.
 *
 * `details` is one free-text box rather than a field per banking system on
 * purpose. This build pays by hand, and a human reading "IBAN GB33BUKB…, ref
 * NORTHLIGHT" copes fine with whatever shape it arrives in — whereas a form
 * with `sortCode` and `accountNumber` quietly excludes every partner outside
 * the two countries whose banking we happened to model. When a payments
 * integration lands it can ask for structured fields, and it will know which
 * ones because these boxes will have told us.
 */
export function PayoutForm({ partner }: { partner: Partner }) {
  const [state, action] = useActionState<FormState, FormData>(savePayoutPreferences, undefined);

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <Select
        name="method"
        label="How would you like to be paid?"
        required
        defaultValue={partner.payoutMethod ?? "bank"}
        options={[
          { value: "bank", label: "Bank transfer" },
          { value: "paypal", label: "PayPal" },
          { value: "wise", label: "Wise" },
          { value: "other", label: "Something else" },
        ]}
      />

      <Select
        name="currency"
        label="Payout currency"
        required
        defaultValue={partner.payoutCurrency}
        options={[
          { value: "USD", label: "USD — US dollar" },
          { value: "EUR", label: "EUR — Euro" },
          { value: "GBP", label: "GBP — Pound sterling" },
          { value: "INR", label: "INR — Indian rupee" },
          { value: "AUD", label: "AUD — Australian dollar" },
          { value: "CAD", label: "CAD — Canadian dollar" },
        ]}
        hint="Your commissions are recorded in whatever currency the store was charged in. This is what we convert to when we pay you."
      />

      <TextArea
        name="details"
        label="Account details"
        required
        rows={4}
        defaultValue={partner.payoutDetails ?? ""}
        placeholder={"Account name\nIBAN or account and routing number\nBank name and country"}
        hint="Whatever your bank needs. We read these by hand, so write them the way your bank writes them."
      />

      <div className="sm:max-w-[260px]">
        <Submit pendingLabel="Saving…" variant="secondary">
          Save payout details
        </Submit>
      </div>
    </form>
  );
}
