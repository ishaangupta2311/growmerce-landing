"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { requireAdmin, type Admin } from "@/lib/admin/session";
import { formatDateTime } from "@/lib/announcements/format";
import {
  ADMIN_PATH,
  approvalTarget,
  discardAnnouncement,
  markApproved,
  nextEmailAt,
  postUrl,
  recordApprovalError,
  saveEmail,
} from "@/lib/announcements/store";
import { NO_ACCESS, noteActivity, quoted } from "@/lib/blog/action-guard";
import { setPostPublished } from "@/lib/blog/posts";
import { revalidateBlog } from "@/lib/blog/revalidate";
import { DatabaseUnavailableError } from "@/lib/blog/sql";
import { sendCampaign } from "@/lib/growsearch/email";
import { allows } from "@/lib/team/permissions";

/**
 * What the admin does to a release announcement: save the email, send a test,
 * approve, discard. Each checks the session and that the role can edit
 * Announcements, on every call; the buttons are hidden otherwise, and this is
 * the answer to somebody pressing them anyway.
 *
 * `values` carries the form back, as the campaign form's actions do: React
 * resets an uncontrolled form when its action finishes, and somebody who sent
 * themselves a test should not lose their edits.
 */

export type AnnouncementValues = { subject: string; body: string; ctaLabel: string; testTo: string };

export type AnnouncementFormState = { error?: string; notice?: string; values?: AnnouncementValues } | undefined;

export type DiscardState = { error?: string; notice?: string } | undefined;

const uuid = z.uuid();
const GONE = "This announcement is no longer waiting for approval. Reload the page to see where it went.";

function text(form: FormData, field: string, max: number): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function failure(label: string, err: unknown): string {
  unstable_rethrow(err);
  const why = err instanceof Error ? err.message : String(err);
  console.error(`[admin] ${label} failed — ${why.slice(0, 200)}`);
  return err instanceof DatabaseUnavailableError ? err.message : "Something went wrong. Please try again.";
}

export async function submitAnnouncement(
  _state: AnnouncementFormState,
  form: FormData,
): Promise<AnnouncementFormState> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, "announcements", "edit")) return { error: NO_ACCESS };

  const id = uuid.safeParse(text(form, "id", 64));
  if (!id.success) return { error: "Invalid request." };

  const values: AnnouncementValues = {
    subject: text(form, "subject", 150),
    body: text(form, "body", 10_000),
    ctaLabel: text(form, "ctaLabel", 60),
    testTo: text(form, "testTo", 254) || admin.email,
  };
  const intent = text(form, "intent", 10);
  if (!values.subject || !values.body) return { error: "Write a subject and a message.", values };

  try {
    /* Whatever the button, the email as it stands on screen is saved first:
       a test shows what would be sent, and an approval sends what was read. */
    if (!(await saveEmail(id.data, values))) return { error: GONE };

    if (intent === "test") return await sendTest(admin, id.data, values);
    if (intent === "approve") return await approve(admin, id.data, values);

    revalidatePath(ADMIN_PATH);
    return { notice: "Email saved.", values };
  } catch (err) {
    return { error: failure(`announcement ${intent || "save"}`, err), values };
  }
}

async function sendTest(admin: Admin, id: string, values: AnnouncementValues): Promise<AnnouncementFormState> {
  const target = await approvalTarget(id);
  if (!target) return { error: GONE };

  const answer = await sendCampaign({
    id: target.campaignId,
    subject: target.subject,
    body: target.body,
    ctaLabel: target.ctaLabel,
    ctaUrl: target.post ? postUrl(target.post.slug) : postUrl(""),
    audience: "installed",
    createdBy: admin.email,
    testTo: values.testTo,
  });
  if (!answer.ok) return { error: answer.error, values };

  const sentTo = answer.data.test ? answer.data.sentTo : values.testTo;
  return {
    notice: `Test sent to ${sentTo}. Nothing has gone to merchants. Its button goes to the post's address, which works once the post is published.`,
    values,
  };
}

/**
 * Publish the post, send the campaign, mark the row approved — in that order,
 * and safe to repeat from any point. A post that is already live is left as
 * it is; the campaign id is the row's, minted with it, so the app sends it
 * once however many times it is asked. If the send fails, the row stays
 * pending with the error on it and Approve tries again.
 */
async function approve(admin: Admin, id: string, values: AnnouncementValues): Promise<AnnouncementFormState> {
  const target = await approvalTarget(id);
  if (!target) return { error: GONE };

  const lastSent = target.lastEmailSentAt ? new Date(target.lastEmailSentAt) : null;
  const next = nextEmailAt(lastSent);
  if (lastSent && next) {
    return {
      error: `An announcement email went out on ${formatDateTime(lastSent)}. The next can go out on ${formatDateTime(next)}.`,
      values,
    };
  }

  const post = target.post;
  if (!post) {
    const error =
      "The blog post for this announcement has been deleted. Run `npm run announce` in the Growsearch app again to draft a new one, or discard this announcement.";
    await recordApprovalError(id, error);
    revalidatePath(ADMIN_PATH);
    return { error, values };
  }

  if (post.status !== "published") {
    const published = await setPostPublished(admin.id, post.id, true);
    if (!published) return { error: "The blog post for this announcement no longer exists. Reload the page.", values };
    revalidateBlog();
    await noteActivity(admin, `Published the post /${published.slug} for a release announcement`);
  }

  const answer = await sendCampaign({
    id: target.campaignId,
    subject: target.subject,
    body: target.body,
    ctaLabel: target.ctaLabel,
    ctaUrl: postUrl(post.slug),
    audience: "installed",
    createdBy: admin.email,
  });
  if (!answer.ok || answer.data.test) {
    const why = answer.ok ? "The Growsearch app treated it as a test." : answer.error;
    const error = `The post is published, but the email did not send: ${why} Approve again to retry; merchants will not get it twice.`;
    await recordApprovalError(id, error);
    revalidatePath(ADMIN_PATH);
    return { error, values };
  }

  const receipt = answer.data;
  await markApproved(id, admin.email, post.id, receipt.recipients);
  await noteActivity(
    admin,
    `Approved the release announcement ${quoted(post.title)}: published, and emailed ${receipt.recipients} merchant${receipt.recipients === 1 ? "" : "s"}`,
  );
  revalidatePath(ADMIN_PATH);

  /* The pending form is gone once this lands, and its message with it, so the
     outcome travels in the address instead. */
  redirect(`${ADMIN_PATH}?done=${receipt.created ? "approved" : "already-sent"}`);
}

export async function discardAnnouncementAction(_state: DiscardState, form: FormData): Promise<DiscardState> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, "announcements", "edit")) return { error: NO_ACCESS };

  const id = uuid.safeParse(text(form, "id", 64));
  if (!id.success) return { error: "Invalid request." };

  try {
    const outcome = await discardAnnouncement(id.data, admin.email);
    if (!outcome.ok) return { error: GONE };
    await noteActivity(
      admin,
      `Discarded the release announcement for ${quoted(outcome.releaseRef)}${outcome.deletedPostSlug ? ` and its draft /${outcome.deletedPostSlug}` : ""}`,
    );
  } catch (err) {
    return { error: failure("announcement discard", err) };
  }
  revalidatePath(ADMIN_PATH);
  redirect(`${ADMIN_PATH}?done=discarded`);
}
