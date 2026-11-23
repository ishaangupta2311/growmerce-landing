"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/session";
import { NO_ACCESS, noteActivity, quoted } from "@/lib/blog/action-guard";
import { allows } from "@/lib/team/permissions";
import {
  runEmailSweep,
  sendCampaign,
  sentEmail,
  changeOwnerAlertRecipients,
  changeReportCopies,
  type Answer,
  type Audience,
  type EmailChange,
  type SentEmail,
} from "@/lib/growsearch/email";

/**
 * What the admin does to merchant email. The work happens in the Growsearch
 * app; these check who is asking, and that their role can edit Email, and
 * translate its answer into a sentence.
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

/** Whether a change to a list of addresses was saved. The page shows the list. */
export type EmailListState = { error?: string; notice?: string } | undefined;

function text(form: FormData, field: string, max: number): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function submitCampaign(_state: CampaignState, form: FormData): Promise<CampaignState> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, "email", "edit")) return { error: NO_ACCESS };

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
  if (receipt.created) {
    await noteActivity(admin, `Sent the campaign ${quoted(values.subject)} to ${receipt.recipients} merchant${receipt.recipients === 1 ? "" : "s"}`);
  }
  if (!receipt.created) {
    return { notice: "That campaign had already been sent. It was not sent again." };
  }
  return {
    notice: `Sending to ${receipt.recipients} merchant${receipt.recipients === 1 ? "" : "s"}. Results appear below as they arrive.`,
  };
}

export async function sweepNow(_state: SweepState, _form: FormData): Promise<SweepState> {
  void _form;
  const admin = await requireAdmin();
  if (!allows(admin.grant, "email", "edit")) return { error: NO_ACCESS };

  const answer = await runEmailSweep();
  if (!answer.ok) return { error: answer.error };

  const { configured, sent, failed } = answer.data;
  if (sent.length > 0) await noteActivity(admin, `Ran the lifecycle email check: ${sent.length} sent`);
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

/** One sent email, to show in the portal. Viewing needs only view on Email. */
export async function viewSentEmail(shop: string, emailKey: string): Promise<Answer<SentEmail>> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, "email")) return { ok: false, error: NO_ACCESS };
  if (typeof shop !== "string" || typeof emailKey !== "string") {
    return { ok: false, error: "Name the store and the email." };
  }
  return sentEmail(shop.slice(0, 255), emailKey.slice(0, 200));
}

/**
 * The change an address form asks for: the addresses typed (several can be
 * pasted at once, split on commas, semicolons, or spaces), or the one whose
 * remove button was pressed. The app checks each address.
 */
function requestedChange(form: FormData): EmailChange | null {
  const removed = text(form, "remove", 254);
  if (removed) return { add: [], remove: [removed] };
  const add = text(form, "add", 5_000).split(/[\s,;]+/).filter(Boolean).slice(0, 50);
  return add.length ? { add, remove: [] } : null;
}

function describe({ add, remove }: EmailChange): string {
  return add.length ? `Added ${add.join(", ")} to` : `Removed ${remove.join(", ")} from`;
}

/** Adds or removes an address that gets a copy of a store's weekly report. */
export async function saveReportCopies(_state: EmailListState, form: FormData): Promise<EmailListState> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, "email", "edit")) return { error: NO_ACCESS };

  const shop = text(form, "shop", 255);
  const change = requestedChange(form);
  if (!change) return { error: "Type an address to add." };
  const answer = await changeReportCopies(shop, change);
  if (!answer.ok) return { error: answer.error };

  await noteActivity(admin, `${describe(change)} the weekly report copies for ${shop}`);
  revalidatePath("/admin/email");
  return { notice: "Saved." };
}

/** Adds or removes who gets the team alerts for installs, plans, and uninstalls. */
export async function saveOwnerAlertRecipients(_state: EmailListState, form: FormData): Promise<EmailListState> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, "email", "edit")) return { error: NO_ACCESS };

  const change = requestedChange(form);
  if (!change) return { error: "Type an address to add." };
  const answer = await changeOwnerAlertRecipients(change);
  if (!answer.ok) return { error: answer.error };

  await noteActivity(admin, `${describe(change)} the team alert recipients`);
  revalidatePath("/admin/email");
  return { notice: "Saved." };
}
