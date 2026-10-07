"use client";

import { useActionState } from "react";

import { submitCampaign, type CampaignState } from "@/app/admin/_actions/email";
import ActionButton from "@/components/affiliate/admin/ActionButton";
import { Field, Select, TextArea } from "@/components/affiliate/Field";
import FormBanner from "@/components/affiliate/FormBanner";

/**
 * Write a campaign, send yourself a test, then send it.
 *
 * `campaignId` is minted by the page, not here: it is what makes a double
 * click or a retried request send once, so it has to stay the same until a
 * send succeeds — at which point the page re-renders with a new one.
 *
 * The fields take their defaults from the values the action hands back, so
 * they keep what was typed after a test send and are empty after a real one.
 */
export default function CampaignForm({
  campaignId,
  audiences,
  adminEmail,
}: {
  campaignId: string;
  audiences: { installed: number; all: number };
  adminEmail: string;
}) {
  const [state, action] = useActionState<CampaignState, FormData>(submitCampaign, undefined);
  const values = state?.values;
  const reach = (count: number) => `${count} merchant${count === 1 ? "" : "s"}`;

  return (
    <form action={action} className="space-y-5">
      <FormBanner state={state} />

      <input type="hidden" name="campaignId" value={campaignId} />

      <Field
        name="subject"
        label="Subject"
        required
        defaultValue={values?.subject}
        placeholder="New in Growsearch: search analytics"
        hint="{{shop_name}} becomes the merchant's store name, here and in the message."
      />
      <TextArea
        name="body"
        label="Message"
        rows={9}
        required
        defaultValue={values?.body}
        hint="Plain text. Leave a blank line between paragraphs. The sign-off, the unsubscribe link and our address are added for you."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="ctaLabel" label="Button label" defaultValue={values?.ctaLabel} placeholder="See what's new" />
        <Field
          name="ctaUrl"
          label="Button link"
          type="url"
          defaultValue={values?.ctaUrl}
          placeholder="https://growmerce.ai/blog/…"
        />
      </div>

      <Select
        name="audience"
        label="Send to"
        required
        defaultValue={values?.audience ?? "installed"}
        options={[
          { value: "installed", label: `Merchants with Growsearch installed: ${reach(audiences.installed)}` },
          { value: "all", label: `Everyone, including stores that uninstalled: ${reach(audiences.all)}` },
        ]}
        hint="Unsubscribed addresses are never included. Stores that uninstalled did not ask to hear from us again: use that audience sparingly."
      />

      <Field
        name="testTo"
        label="Send the test to"
        type="email"
        required
        defaultValue={values?.testTo ?? adminEmail}
      />

      <div className="flex flex-wrap gap-3">
        <ActionButton name="intent" value="test">
          Send me a test
        </ActionButton>
        <ActionButton
          name="intent"
          value="send"
          tone="primary"
          confirmText="Send this campaign to merchants now? It cannot be recalled."
        >
          Send to merchants
        </ActionButton>
      </div>
    </form>
  );
}
