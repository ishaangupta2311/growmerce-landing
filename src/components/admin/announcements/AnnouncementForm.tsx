"use client";

import { useActionState } from "react";

import { submitAnnouncement, type AnnouncementFormState } from "@/app/admin/_actions/announcements";
import ActionButton from "@/components/affiliate/admin/ActionButton";
import { Field, TextArea } from "@/components/affiliate/Field";
import FormBanner from "@/components/affiliate/FormBanner";
import type { AnnouncementContent } from "@/lib/announcements/contract";

const PICTURES: Record<string, string> = {
  "blog-answer": "A shopper's question answered from a blog post",
  placements: "Search opening from the right, from the left and full screen",
};

/**
 * The pending announcement's email: a field for each part, a test to yourself,
 * and approve. The layout and pictures are the app's; only the words are here.
 * A field left empty is left out of the email.
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
  version,
  subject,
  content,
  ctaLabel,
  adminEmail,
  canApprove,
  approveNote,
}: {
  id: string;
  version: number;
  subject: string;
  content: AnnouncementContent;
  ctaLabel: string;
  adminEmail: string;
  canApprove: boolean;
  approveNote: string;
}) {
  const [state, action] = useActionState<AnnouncementFormState, FormData>(submitAnnouncement, undefined);
  const values = state?.values;
  const email = values?.content ?? content;

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={values?.version ?? version} />

      <Field
        name="subject"
        label="Subject"
        required
        defaultValue={values?.subject ?? subject}
        hint="{{shop_name}} becomes the merchant's store name, here and in the intro."
      />
      <Field name="title" label="Title" required defaultValue={email.title} />
      <TextArea name="intro" label="Intro" rows={2} required defaultValue={email.intro} />

      {email.action && (
        <fieldset className="space-y-4 rounded-[10px] border border-line p-4">
          <legend className="px-1 text-[14px] font-bold text-charcoal">Action needed card</legend>
          <Field name="action.title" label="What to do" required defaultValue={email.action.title} />
          <TextArea name="action.text" label="Where to do it" rows={2} defaultValue={email.action.text} />
          <Field
            name="action.ctaLabel"
            label="Button label"
            required
            defaultValue={email.action.ctaLabel}
            hint="The button opens Growsearch in the merchant's own Shopify admin."
          />
        </fieldset>
      )}

      {email.sections.map((section, s) => (
        <fieldset key={s} className="space-y-4 rounded-[10px] border border-line p-4">
          <legend className="px-1 text-[14px] font-bold text-charcoal">Section {s + 1}</legend>
          <input type="hidden" name={`s${s}.visual`} value={section.visual ?? ""} />
          <Field name={`s${s}.heading`} label="Heading" defaultValue={section.heading} />
          <TextArea name={`s${s}.text`} label="Text" rows={2} defaultValue={section.text} />
          {section.visual && (
            <p className="text-[13.5px] leading-snug text-body-mute">
              Picture: {PICTURES[section.visual] ?? section.visual}
            </p>
          )}
          <Field name={`s${s}.caption`} label="Caption" defaultValue={section.caption} />
          <TextArea name={`s${s}.lead`} label="Line before the list" rows={2} defaultValue={section.lead} />
          {section.items.map((item, i) => (
            <div key={i} className="space-y-3 rounded-[10px] bg-cream p-3">
              <Field
                name={`s${s}.i${i}.title`}
                label={`List item ${i + 1}`}
                defaultValue={item.title}
                hint="Clear this to remove the item."
              />
              <Field name={`s${s}.i${i}.text`} label="Its text" defaultValue={item.text} />
            </div>
          ))}
          <TextArea name={`s${s}.note`} label="Small note" rows={2} defaultValue={section.note} />
        </fieldset>
      ))}

      <Field
        name="ctaLabel"
        label="Button to the post"
        defaultValue={values?.ctaLabel ?? ctaLabel}
        hint="The button at the end of the email links to the blog post."
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
          confirmText="Email every merchant with Growsearch installed now? The email cannot be recalled."
        >
          Approve and send
        </ActionButton>
      </div>
      <p className="text-[13.5px] leading-snug text-body-mute">{approveNote}</p>
    </form>
  );
}
