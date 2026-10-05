"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/session";
import { runEmailSweep, sendCampaign, type Audience } from "@/lib/growsearch/email";

/**
 * What the admin does to merchant email. The work happens in the Growsearch
 * app; these check who is asking and translate its answer into a sentence.
 *
 * `values` carries the form back after a test send or a refusal. React resets
 * an uncontrolled form when its action finishes, and an admin who sent
 * themselves a test should not have to type the campaign again to send it.
 */
export type CampaignValues = {
  subject: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  audience: Audience;
  testTo: string;
};

export type CampaignState = { error?: string; notice?: string; values?: CampaignValues } | undefined;

export type SweepState = { error?: string; notice?: string } | undefined;

function text(form: FormData, field: string, max: number): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function submitCampaign(_state: CampaignState, form: FormData): Promise<CampaignState> {
  const admin = await requireAdmin();

  const values: CampaignValues = {
    subject: text(form, "subject", 150),
    body: text(form, "body", 10_000),
    ctaLabel: text(form, "ctaLabel", 60),
    ctaUrl: text(form, "ctaUrl", 500),
    audience: text(form, "audience", 20) === "all" ? "all" : "installed",
    testTo: text(form, "testTo", 254) || admin.email,
  };
  const test = text(form, "intent", 10) !== "send";

  const answer = await sendCampaign({
    id: text(form, "campaignId", 64),
    subject: values.subject,
    body: values.body,
    ctaLabel: values.ctaLabel,
    ctaUrl: values.ctaUrl,
    audience: values.audience,
    createdBy: admin.email,
    ...(test ? { testTo: values.testTo } : {}),
  });

  if (!answer.ok) return { error: answer.error, values };

  const receipt = answer.data;
  if (receipt.test) {
    return { notice: `Test sent to ${receipt.sentTo}. Nothing has gone to merchants.`, values };
  }

  /* A new page render mints a new campaign id, so the next campaign is not
     mistaken for a repeat of this one. */
  revalidatePath("/admin/email");
  if (!receipt.created) {
    return { notice: "That campaign had already been sent. It was not sent again." };
  }
  return {
    notice: `Sending to ${receipt.recipients} merchant${receipt.recipients === 1 ? "" : "s"}. Results appear below as they arrive.`,
  };
}

export async function sweepNow(_state: SweepState, _form: FormData): Promise<SweepState> {
  void _form;
  await requireAdmin();

  const answer = await runEmailSweep();
  if (!answer.ok) return { error: answer.error };

  const { configured, sent, failed } = answer.data;
  revalidatePath("/admin/email");
  if (!configured) return { error: "Email is not configured on the Growsearch app, so nothing was sent." };

  const parts = [
    sent.length === 0
      ? "No lifecycle email was due."
      : `Sent ${sent.length} lifecycle email${sent.length === 1 ? "" : "s"}.`,
  ];
  if (failed.length > 0) {
    parts.push(`${failed.length} failed and will be retried by the next run.`);
  }
  return { notice: parts.join(" ") };
}
