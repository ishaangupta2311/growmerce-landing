"use client";

import { useActionState } from "react";

import { settleSendAction, type DiscardState } from "@/app/admin/_actions/announcements";
import ActionButton from "@/components/affiliate/admin/ActionButton";

/**
 * Shown when an approval started sending and we never heard how it ended. The
 * email may be out, so it can't be edited, discarded or approved again. This
 * only asks the app whether it has the campaign, and records the answer.
 */
export default function ConfirmSendForm({ id }: { id: string }) {
  const [state, action] = useActionState<DiscardState, FormData>(settleSendAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p role="alert" className="text-[14.5px] leading-snug text-brand">
          {state.error}
        </p>
      )}
      <input type="hidden" name="id" value={id} />
      <p className="text-[14.5px] leading-snug text-charcoal">
        An approval started sending this email and we did not hear how it ended, so it may already have gone out. It
        can&apos;t be changed until we know. Checking asks the Growsearch app, and sends nothing.
      </p>
      <ActionButton name="intent" value="settle" tone="primary">
        Check what happened
      </ActionButton>
    </form>
  );
}
