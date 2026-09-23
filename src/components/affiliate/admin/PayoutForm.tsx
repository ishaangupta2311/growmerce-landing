"use client";

import { useActionState } from "react";

import { createPayout, type FormState } from "@/app/admin/_actions/affiliates";
import { formatMoney } from "@/lib/affiliate/format";
import type { AmountDue } from "@/lib/affiliate/admin-store";

import { Field, Select, TextArea } from "../Field";
import FormBanner from "../FormBanner";
import Submit from "../Submit";

/**
 * Records a payment that has already been made.
 *
 * The amount is not a field. It is displayed, and submitted as a hidden
 * `expectedCents` that the server checks against the live sum before settling
 * anything — so the worst this form can do is refuse. An editable amount would
 * make it possible to record a payout that disagrees with the ledger it is
 * settling, and the ledger is the thing we would later have to defend.
 *
 * The partner's own stated payout details sit above the fields rather than
 * behind a link, because the person filling this in has just copied them into
 * their banking app and is about to type what it gave back.
 */
export default function PayoutForm({ due }: { due: AmountDue }) {
  const [state, action] = useActionState<FormState, FormData>(createPayout, undefined);

  const amount = formatMoney(due.owedCents, due.currency);

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <input type="hidden" name="partnerId" value={due.partnerId} />
      <input type="hidden" name="currency" value={due.currency} />
      <input type="hidden" name="expectedCents" value={due.owedCents} />

      <div className="rounded-[12px] border border-brand/25 bg-cream px-5 py-4">
        <p className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
          Paying
        </p>
        <p className="mt-1.5 text-[26px] leading-none font-bold tabular-nums text-brand">
          {amount}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-body-mute">
          Settles {due.commissionCount} commission
          {due.commissionCount === 1 ? "" : "s"}. Record this only after the
          money has actually left — this marks them paid.
        </p>
      </div>

      <div>
        <p className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
          Where they asked to be paid
        </p>
        {due.payoutDetails ? (
          <p className="mt-1.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-charcoal">
            {due.payoutDetails}
          </p>
        ) : (
          <p className="mt-1.5 text-[15px] leading-relaxed text-body-mute">
            They have not filled in payout details yet. Ask them before paying —
            there is nowhere to send this.
          </p>
        )}
      </div>

      <Select
        name="method"
        label="How you paid it"
        required
        defaultValue={due.payoutMethod ?? "bank"}
        options={[
          { value: "bank", label: "Bank transfer" },
          { value: "paypal", label: "PayPal" },
          { value: "wise", label: "Wise" },
          { value: "other", label: "Something else" },
        ]}
      />
      <Field
        name="reference"
        label="Bank reference"
        placeholder="FT26091234"
        hint="Whatever the bank called it. This is what we quote back when they ask where their money is."
      />
      <TextArea name="note" label="Note" rows={2} hint="Only we see this." />

      <Submit pendingLabel="Recording…">Record this payout</Submit>
    </form>
  );
}
