"use client";

import { useActionState } from "react";

import { submitAnnouncement, type AnnouncementFormState } from "@/app/admin/_actions/announcements";
import ActionButton from "@/components/affiliate/admin/ActionButton";
import FormBanner from "@/components/affiliate/FormBanner";

/**
 * Shown when an approval started sending and we never heard how it ended. The
 * email may be out, so it can't be edited or discarded. Pressing this asks the
 * app again with the same campaign id: it finds the campaign it already has, or
 * sends it once.
 */
export default function ConfirmSendForm({ id, version }: { id: string; version: number }) {
  const [state, action] = useActionState<AnnouncementFormState, FormData>(submitAnnouncement, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormBanner state={state} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="confirm" value="1" />
      <p className="text-[14.5px] leading-snug text-charcoal">
        An approval started sending this email and we did not hear how it ended, so it may already have gone out. It
        can&apos;t be changed now. Press the button to settle it: merchants will not get it twice.
      </p>
      <ActionButton name="intent" value="approve" tone="primary">
        Finish sending
      </ActionButton>
    </form>
  );
}
