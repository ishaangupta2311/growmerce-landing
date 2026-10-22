"use client";

import { useActionState } from "react";

import { discardAnnouncementAction, type DiscardState } from "@/app/admin/_actions/announcements";
import ActionButton from "@/components/affiliate/admin/ActionButton";

/**
 * Throws the pending announcement away. Its release notes count as dealt
 * with, so the app's next announcement starts after them; the draft post is
 * deleted unless somebody has published it meanwhile.
 */
export default function DiscardButton({ id }: { id: string }) {
  const [state, action] = useActionState<DiscardState, FormData>(discardAnnouncementAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-3">
      {state?.error && (
        <p role="alert" className="text-[13.5px] text-brand">
          {state.error}
        </p>
      )}
      <input type="hidden" name="id" value={id} />
      <ActionButton
        name="intent"
        value="discard"
        tone="danger"
        confirmText="Discard this announcement? The draft post is deleted, nothing is sent, and these release notes will not be announced."
      >
        Discard
      </ActionButton>
    </form>
  );
}
