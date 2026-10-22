"use client";

import { useActionState } from "react";

import { submitAnnouncement, type AnnouncementFormState } from "@/app/admin/_actions/announcements";
import ActionButton from "@/components/affiliate/admin/ActionButton";
import { Field, TextArea } from "@/components/affiliate/Field";
import FormBanner from "@/components/affiliate/FormBanner";

/**
 * The pending announcement's email: edit it, send yourself a test, approve.
 *
 * Every button saves what is on screen first (see `submitAnnouncement`), so
 * the test is what would be sent and Approve sends what was read. Approve is
 * off while the seven-day cap holds; the page says until when, right above.
 *
 * The fields take their defaults from what the action hands back, as the
 * campaign form's do, so a test send or a refusal keeps the edits.
 */
export default function AnnouncementForm({
  id,
  subject,
  body,
  ctaLabel,
  adminEmail,
  canApprove,
  approveNote,
}: {
  id: string;
  subject: string;
  body: string;
  ctaLabel: string;
  adminEmail: string;
  canApprove: boolean;
  approveNote: string;
}) {
  const [state, action] = useActionState<AnnouncementFormState, FormData>(submitAnnouncement, undefined);
  const values = state?.values;

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <input type="hidden" name="id" value={id} />

      <Field
        name="subject"
        label="Subject"
        required
        defaultValue={values?.subject ?? subject}
        hint="{{shop_name}} becomes the merchant's store name, here and in the message."
      />
      <TextArea
        name="body"
        label="Message"
        rows={12}
        required
        defaultValue={values?.body ?? body}
        hint="Plain text. Leave a blank line between paragraphs. The sign-off, the unsubscribe link and our address are added for you."
      />
      <Field
        name="ctaLabel"
        label="Button label"
        defaultValue={values?.ctaLabel ?? ctaLabel}
        hint="The button links to the blog post."
      />
      <Field name="testTo" label="Send the test to" type="email" required defaultValue={values?.testTo ?? adminEmail} />

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton name="intent" value="save">
          Save email
        </ActionButton>
        <ActionButton name="intent" value="test">
          Send me a test
        </ActionButton>
        <ActionButton
          name="intent"
          value="approve"
          tone="primary"
          disabled={!canApprove}
          confirmText="Publish the post and email every merchant with Growsearch installed now? The email cannot be recalled."
        >
          Approve: publish and send
        </ActionButton>
      </div>
      <p className="text-[13.5px] leading-snug text-body-mute">{approveNote}</p>
    </form>
  );
}
