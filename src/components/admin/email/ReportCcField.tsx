"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { saveReportCc, type ReportCcState } from "@/app/admin/_actions/email";

/**
 * The address that gets its own copy of a store's weekly report, usually the
 * agency that runs it. Saving an empty field removes it. The agency's copy has
 * its own unsubscribe link, so it never affects the merchant's email.
 *
 * The field is controlled: React resets an uncontrolled field once a form
 * action finishes, which would wipe what the admin typed when a save is
 * refused.
 */
export default function ReportCcField({ shop, value }: { shop: string; value: string | null }) {
  const [state, action] = useActionState<ReportCcState, FormData>(saveReportCc, undefined);
  const [draft, setDraft] = useState(value ?? "");

  return (
    <form action={action} className="flex min-w-[16rem] flex-col gap-1">
      <input type="hidden" name="shop" value={shop} />
      <div className="flex items-center gap-2">
        <input
          type="email"
          name="reportCcEmail"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="agency@example.com"
          aria-label={`Weekly report copy for ${shop}`}
          className="w-full min-w-0 rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[14px] text-charcoal placeholder:text-muted focus:border-brand focus:outline-none"
        />
        <SaveButton />
      </div>
      {(state?.error || state?.notice) && (
        <p role={state.error ? "alert" : "status"} className={`text-[13px] ${state.error ? "text-brand" : "text-body-mute"}`}>
          {state.error ?? state.notice}
        </p>
      )}
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13.5px] font-bold text-charcoal transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
