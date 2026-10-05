"use client";

import { useActionState } from "react";

import { sweepNow, type SweepState } from "@/app/admin/_actions/email";
import ActionButton from "@/components/affiliate/admin/ActionButton";

/**
 * Runs the lifecycle sweep now instead of waiting for the daily job. It sends
 * only what is already due, so pressing it twice sends nothing twice.
 */
export default function SweepButton() {
  const [state, action] = useActionState<SweepState, FormData>(sweepNow, undefined);

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-3">
      {(state?.error || state?.notice) && (
        <p role={state.error ? "alert" : "status"} className="text-[13.5px] text-body-mute">
          {state.error ?? state.notice}
        </p>
      )}
      <ActionButton name="intent" value="sweep">
        Send what is due now
      </ActionButton>
    </form>
  );
}
