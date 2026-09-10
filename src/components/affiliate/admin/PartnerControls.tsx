"use client";

import { useActionState } from "react";

import { replayHeld, updateRate, updateStatus, type FormState } from "@/app/affiliates/admin/actions";
import { formatRate } from "@/lib/affiliate/commission";
import type { Partner } from "@/lib/affiliate/types";

import { Field } from "../Field";
import FormBanner from "../FormBanner";
import Submit from "../Submit";
import ActionButton from "./ActionButton";

/**
 * The three things an admin does to a partner account, as three separate forms.
 *
 * Separate on purpose. One form with a save button would let a misclick on the
 * status radio ride along with an intended rate change, and these have very
 * different consequences: a rate is a number, a status is somebody's access to
 * their own earnings. Each form does one thing and reports on that one thing.
 */

export function StatusControls({ partner }: { partner: Partner }) {
  const [state, action] = useActionState<FormState, FormData>(updateStatus, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormBanner state={state} />
      <input type="hidden" name="partnerId" value={partner.id} />

      <div className="flex flex-wrap gap-2.5">
        {partner.status !== "approved" && (
          <ActionButton name="status" value="approved" tone="primary">
            Approve
          </ActionButton>
        )}
        {partner.status === "approved" && (
          <ActionButton
            name="status"
            value="suspended"
            tone="danger"
            confirmText={`Suspend ${partner.company}? They keep their login but their dashboard stops rendering, and new charges stop earning.`}
          >
            Suspend
          </ActionButton>
        )}
        {partner.status !== "rejected" && (
          <ActionButton
            name="status"
            value="rejected"
            tone="danger"
            confirmText={`Reject ${partner.company}? They can still sign in, but see a closed-account page instead of a dashboard.`}
          >
            Reject
          </ActionButton>
        )}
        {partner.status !== "pending" && (
          <ActionButton name="status" value="pending">
            Back to the queue
          </ActionButton>
        )}
      </div>

      <p className="text-[14px] leading-relaxed text-body-mute">
        {partner.status === "approved"
          ? "Approved. Charges from their referred stores earn commission, and it clears 30 days later."
          : "Not approved. Charges from their stores earn nothing at all while this is the case — approving replays any that were held."}
      </p>
    </form>
  );
}

export function RateControls({ partner }: { partner: Partner }) {
  const [state, action] = useActionState<FormState, FormData>(updateRate, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormBanner state={state} />
      <input type="hidden" name="partnerId" value={partner.id} />

      <div className="sm:max-w-[240px]">
        <Field
          name="percent"
          label="Commission rate (%)"
          required
          defaultValue={String(partner.commissionRateBps / 100)}
          hint={`Currently ${formatRate(partner.commissionRateBps)}.`}
        />
      </div>

      <p className="text-[14px] leading-relaxed text-body-mute">
        Applies to commission earned from here on.{" "}
        <strong className="font-bold text-charcoal">
          Nothing already in their ledger changes
        </strong>{" "}
        — every commission keeps the rate it was calculated at, so their past
        earnings stay reconcilable against what they were told at the time.
      </p>

      <div className="sm:max-w-[200px]">
        <Submit pendingLabel="Saving…" variant="secondary">
          Change the rate
        </Submit>
      </div>
    </form>
  );
}

/**
 * Replays charges that were skipped while the application was pending.
 *
 * Only rendered when there are some. It is on the page as well as inside the
 * approve action because the approve action only gained it recently, and a
 * partner approved before that still has held charges nobody has paid.
 */
export function ReplayControls({ partner, held }: { partner: Partner; held: number }) {
  const [state, action] = useActionState<FormState, FormData>(replayHeld, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormBanner state={state} />
      <input type="hidden" name="partnerId" value={partner.id} />

      <p className="text-[15px] leading-relaxed text-charcoal">
        <strong className="font-bold">
          {held} charge{held === 1 ? "" : "s"}
        </strong>{" "}
        from this partner&rsquo;s stores arrived while the account was not
        approved, and earned nothing. Replaying re-runs them through the ledger
        at the partner&rsquo;s current rate. Safe to press twice — a charge
        already credited is refused by the ledger, not paid again.
      </p>

      <div className="sm:max-w-[240px]">
        <Submit pendingLabel="Replaying…" variant="secondary">
          Replay held charges
        </Submit>
      </div>
    </form>
  );
}
