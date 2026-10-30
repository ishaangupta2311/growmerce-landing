"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { requireAdmin, type Admin } from "@/lib/admin/session";
import { announcementSchema, describeIssue, type AnnouncementContent } from "@/lib/announcements/contract";
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

export type AnnouncementValues = { subject: string; content: AnnouncementContent; ctaLabel: string; testTo: string };

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

/**
 * The email from the form's fields: `action.*`, and `s<n>.*` and `s<n>.i<m>.*`
 * for each section and item. A section's picture is not editable; it comes
 * through as a hidden field. An item whose title was cleared is dropped.
 */
function contentFrom(form: FormData): unknown {
  const sections = [];
  for (let s = 0; form.has(`s${s}.heading`); s += 1) {
    const items = [];
    for (let i = 0; form.has(`s${s}.i${i}.title`); i += 1) {
      const title = text(form, `s${s}.i${i}.title`, 200);
      if (title) items.push({ title, text: text(form, `s${s}.i${i}.text`, 500) });
    }
    sections.push({
      heading: text(form, `s${s}.heading`, 200),
      text: text(form, `s${s}.text`, 1000),
      visual: text(form, `s${s}.visual`, 40) || null,
      caption: text(form, `s${s}.caption`, 500),
      lead: text(form, `s${s}.lead`, 500),
      items,
      note: text(form, `s${s}.note`, 1000),
    });
  }
  return {
    title: text(form, "title", 300),
    intro: text(form, "intro", 1000),
    action: form.has("action.title")
      ? {
          title: text(form, "action.title", 200),
          text: text(form, "action.text", 1000),
          ctaLabel: text(form, "action.ctaLabel", 100),
        }
      : null,
    sections,
  };
}

export async function submitAnnouncement(
  _state: AnnouncementFormState,
  form: FormData,
): Promise<AnnouncementFormState> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, "announcements", "edit")) return { error: NO_ACCESS };

  const id = uuid.safeParse(text(form, "id", 64));
  if (!id.success) return { error: "Invalid request." };

  const content = announcementSchema.safeParse(contentFrom(form));
  if (!content.success) return { error: `Check the email: ${describeIssue(content.error)}.` };

  const values: AnnouncementValues = {
    subject: text(form, "subject", 150),
    content: content.data,
    ctaLabel: text(form, "ctaLabel", 40),
    testTo: text(form, "testTo", 254) || admin.email,
  };
  const intent = text(form, "intent", 10);
  if (!values.subject) return { error: "Write a subject.", values };

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
    body: "",
    announcement: target.content,
    ctaLabel: target.ctaLabel,
    ctaUrl: target.post ? postUrl(target.post.slug) : postUrl(""),
    audience: "installed",
    createdBy: admin.email,
    testTo: values.testTo,
  });
  if (!answer.ok) return { error: answer.error, values };

  const sentTo = answer.data.test ? answer.data.sentTo : values.testTo;
  return {
    notice: `Test sent to ${sentTo}. Nothing has gone to merchants. It is addressed to a sample store, so its Action needed button opens that store's admin; a real merchant's opens their own.`,
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
    body: "",
    announcement: target.content,
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
