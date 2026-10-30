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
  claimApproval,
  clearSendRequest,
  discardAnnouncement,
  markApproved,
  postUrl,
  releaseApproval,
  requestSend,
  saveEmail,
  settleSent,
  unsettledSend,
} from "@/lib/announcements/store";
import { NO_ACCESS, noteActivity, quoted } from "@/lib/blog/action-guard";
import { setPostPublished } from "@/lib/blog/posts";
import { revalidateBlog } from "@/lib/blog/revalidate";
import { DatabaseUnavailableError } from "@/lib/blog/sql";
import { campaignStatus, previewCampaign, sendCampaign, type CampaignInput } from "@/lib/growsearch/email";
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

export type AnnouncementValues = {
  version: number;
  subject: string;
  content: AnnouncementContent;
  ctaLabel: string;
  testTo: string;
};

export type AnnouncementFormState = { error?: string; notice?: string; values?: AnnouncementValues } | undefined;

export type DiscardState = { error?: string; notice?: string } | undefined;

const uuid = z.uuid();
const GONE = "This announcement is no longer waiting for approval. Reload the page to see where it went.";
const CHANGED =
  "This announcement changed since you opened it, or is being approved right now. Reload the page to see the latest; your edits here were not saved.";

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
  /* A section with everything cleared is gone, not an empty box the app refuses. */
  const kept = sections.filter(
    (section) =>
      section.heading || section.text || section.visual || section.caption || section.lead || section.note || section.items.length,
  );
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
    sections: kept,
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

  const version = Number(text(form, "version", 12));
  if (!Number.isInteger(version)) return { error: "Invalid request." };

  const submitted = contentFrom(form);
  const parsed = announcementSchema.safeParse(submitted);
  const values: AnnouncementValues = {
    version,
    subject: text(form, "subject", 150),
    /* A refused email goes back as typed: the form resets to what it is handed. */
    content: parsed.success ? parsed.data : (submitted as AnnouncementContent),
    ctaLabel: text(form, "ctaLabel", 40),
    testTo: text(form, "testTo", 254) || admin.email,
  };
  if (!parsed.success) return { error: `Check the email: ${describeIssue(parsed.error)}.`, values };
  const intent = text(form, "intent", 10);
  if (!values.subject) return { error: "Write a subject.", values };

  try {
    /* Whatever the button, the email as it stands on screen is saved first:
       a test shows what would be sent, and an approval sends what was read. */
    const saved = await saveEmail(id.data, version, values);
    if (saved === null) return { error: CHANGED, values };
    values.version = saved;

    if (intent === "test") return await sendTest(admin, id.data, values);
    if (intent === "approve") return await approve(admin, id.data, saved, values);

    revalidatePath(ADMIN_PATH);
    return { notice: "Email saved.", values };
  } catch (err) {
    return { error: failure(`announcement ${intent || "save"}`, err), values };
  }
}

function campaignFor(target: NonNullable<Awaited<ReturnType<typeof approvalTarget>>>, admin: Admin): CampaignInput {
  return {
    id: target.campaignId,
    subject: target.subject,
    body: "",
    announcement: target.content,
    ctaLabel: target.ctaLabel,
    ctaUrl: postUrl(target.post?.slug ?? ""),
    audience: "installed",
    createdBy: admin.email,
  };
}

async function sendTest(admin: Admin, id: string, values: AnnouncementValues): Promise<AnnouncementFormState> {
  const target = await approvalTarget(id);
  if (!target) return { error: GONE };

  const answer = await sendCampaign({ ...campaignFor(target, admin), testTo: values.testTo });
  if (!answer.ok) return { error: answer.error, values };

  const sentTo = answer.data.test ? answer.data.sentTo : values.testTo;
  return {
    notice: `Test sent to ${sentTo}. Nothing has gone to merchants. It is addressed to a sample store, so its Action needed button opens that store's admin; a real merchant's opens their own.`,
    values,
  };
}

/**
 * Claim the row, check the app will take the email, publish the post, record
 * that the send is starting, send the campaign, mark the row approved. The claim
 * means nothing can change the row meanwhile, and the record keeps it that way
 * from then on if we never hear back. The campaign id is the row's, minted with
 * it, so the app sends it once however many times it is asked. If anything
 * fails, the error stays on the row and Approve tries again.
 */
async function approve(
  admin: Admin,
  id: string,
  version: number,
  values: AnnouncementValues,
): Promise<AnnouncementFormState> {
  const claim = await claimApproval(id, version);
  if (!claim.ok) {
    if (claim.reason === "changed") return { error: CHANGED, values };
    return {
      error: `An announcement email went out on ${formatDateTime(claim.lastSentAt)}. The next can go out on ${formatDateTime(claim.nextAt)}.`,
      values,
    };
  }
  const token = claim.token;

  const stop = async (error: string, options?: { sendRefused?: boolean }): Promise<AnnouncementFormState> => {
    await releaseApproval(id, token, error, options);
    revalidatePath(ADMIN_PATH);
    return { error, values };
  };

  let sent: { title: string; recipients: number; created: boolean };
  try {
    const target = await approvalTarget(id);
    if (!target) return { error: GONE };

    if (!target.post) {
      return await stop(
        "The blog post for this announcement has been deleted. Run `npm run announce` in the Growsearch app again to draft a new one, or discard this announcement.",
      );
    }

    /* Asked before anything is published: an email the app would refuse must
       not leave the post live with nothing sent. */
    const preview = await previewCampaign(campaignFor(target, admin));
    if (!preview.ok) return await stop(`Nothing was published or sent: ${preview.error}`);

    if (target.post.status !== "published") {
      const published = await setPostPublished(admin.id, target.post.id, true);
      if (!published) return await stop("The blog post for this announcement no longer exists. Reload the page.");
      revalidateBlog();
      await noteActivity(admin, `Published the post /${published.slug} for a release announcement`);
    }

    /* Read again now: the email links to the post, and its slug may have been
       edited while the app was answering. */
    const latest = await approvalTarget(id);
    if (!latest?.post || latest.post.status !== "published") {
      return await stop("The blog post changed during the approval, so nothing was sent. Reload the page and approve again.");
    }

    if (!(await requestSend(id, token))) {
      return await stop("This approval took too long, so nothing was sent. Reload the page and approve again.");
    }

    const answer = await sendCampaign(campaignFor(latest, admin));
    if (!answer.ok && answer.refused) {
      return await stop(`The post is live, but the app refused the email: ${answer.error} Nothing was sent.`, {
        sendRefused: true,
      });
    }
    if (!answer.ok || answer.data.test) {
      const why = answer.ok ? "The Growsearch app treated it as a test." : answer.error;
      return await stop(
        `We could not confirm the email went out, so it may have: ${why} Use "Check what happened" on this page; it sends nothing.`,
      );
    }
    sent = { title: latest.post.title, recipients: answer.data.recipients, created: answer.data.created };
  } catch (err) {
    await releaseApproval(id, token, err instanceof Error ? err.message : String(err)).catch(() => {});
    throw err;
  }

  const recorded = await markApproved(id, token, admin.email, sent.recipients);
  revalidatePath(ADMIN_PATH);
  if (!recorded) {
    console.error(`[admin] announcement ${id} was sent but its approval lapsed before it could be recorded`);
    return {
      error: `The email went to ${sent.recipients} merchants, but this approval took too long to be recorded as approved. Do not approve it again without checking the Email page.`,
      values,
    };
  }
  await noteActivity(
    admin,
    `Approved the release announcement ${quoted(sent.title)}: emailed ${sent.recipients} merchant${sent.recipients === 1 ? "" : "s"}`,
  );

  /* The pending form is gone once this lands, and its message with it, so the
     outcome travels in the address instead. */
  redirect(`${ADMIN_PATH}?done=${sent.created ? "approved" : "already-sent"}`);
}

/**
 * Settles an approval that started sending and never heard how it ended, by
 * asking the app whether it has the campaign. It sends nothing. If the app has
 * it, the email went (the app's sweep finishes any delivery left over), so the
 * row is recorded as approved. If it doesn't, nothing went and the row is free
 * again. If the app can't say, nothing changes. None of this needs the post.
 */
export async function settleSendAction(_state: DiscardState, form: FormData): Promise<DiscardState> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, "announcements", "edit")) return { error: NO_ACCESS };

  const id = uuid.safeParse(text(form, "id", 64));
  if (!id.success) return { error: "Invalid request." };

  let done: "already-sent" | "not-sent";
  try {
    const unsettled = await unsettledSend(id.data);
    if (!unsettled) {
      return { error: "There is nothing to check right now: an approval may still be running. Reload the page in a few minutes." };
    }
    const answer = await campaignStatus(unsettled.campaignId);
    if (!answer.ok) return { error: `Could not ask the Growsearch app, so nothing changed: ${answer.error}` };

    if (answer.data.exists) {
      await settleSent(id.data, admin.email, answer.data.recipients);
      await noteActivity(
        admin,
        `Settled the release announcement ${quoted(unsettled.postTitle ?? "(post deleted)")}: the app had the email, for ${answer.data.recipients} merchants`,
      );
      done = "already-sent";
    } else {
      await clearSendRequest(id.data);
      done = "not-sent";
    }
  } catch (err) {
    return { error: failure("announcement settle", err) };
  }
  revalidatePath(ADMIN_PATH);
  redirect(`${ADMIN_PATH}?done=${done}`);
}

export async function discardAnnouncementAction(_state: DiscardState, form: FormData): Promise<DiscardState> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, "announcements", "edit")) return { error: NO_ACCESS };

  const id = uuid.safeParse(text(form, "id", 64));
  if (!id.success) return { error: "Invalid request." };

  try {
    const outcome = await discardAnnouncement(id.data, admin.email);
    if (!outcome.ok) {
      return { error: outcome.busy ? "This announcement is being approved, or its email may have gone out." : GONE };
    }
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
