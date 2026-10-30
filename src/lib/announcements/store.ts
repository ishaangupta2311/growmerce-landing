import "server-only";

import type { Sql } from "postgres";

import { htmlToText, sanitizeContent } from "@/lib/blog/sanitize";
import { nextFreeSlug, slugFamilyPattern, slugify } from "@/lib/blog/slug";
import { requireSql } from "@/lib/blog/sql";
import type { PostStatus } from "@/lib/blog/types";
import { RESERVED_POST_SLUGS } from "@/lib/blog/validation";
import { transaction, type Tx } from "@/lib/db";
import { SITE_ORIGIN } from "@/lib/site-urls";
import { DEFAULT_CTA_LABEL, type AnnouncementContent, type DraftInput, type SkipInput } from "./contract";

/**
 * Release announcements: the rows in `blog.announcement`
 * (migrations/0014_announcements.sql) and the draft posts they own.
 *
 * Two kinds of caller. The signed API (src/app/api/announcements) writes
 * drafts and skips for the Growsearch app; the admin page reads, edits,
 * approves and discards. Neither checks who is asking here: the route has
 * verified the signature, and the admin actions have passed `requireAdmin()`
 * and the Announcements permission.
 *
 * Every write that decides "which row is pending" runs in one transaction
 * behind one advisory lock, so a draft arriving while somebody discards, or
 * two drafts arriving at once, are applied one after the other rather than
 * both seeing "nothing pending" and tripping the one-pending index.
 */

export const ADMIN_PATH = "/admin/announcements";

/** At most one announcement email per this many days. */
export const EMAIL_CAP_DAYS = 7;
export const EMAIL_CAP_MS = EMAIL_CAP_DAYS * 24 * 60 * 60 * 1000;

const CATEGORY = {
  name: "Product updates",
  slug: "product-updates",
  description: "What's new in Growsearch, release by release.",
};

const DEFAULT_AUTHOR = { name: "Growsearch team", slug: "growsearch-team" };

export type AnnouncementStatus = "pending" | "approved" | "skipped" | "discarded";

/** A post's public address. Emails go to real merchants, so always the live site's. */
export function postUrl(slug: string): string {
  return `${SITE_ORIGIN}/blog/${slug}`;
}

/** When the next announcement email may go out, or null if it may go now. */
export function nextEmailAt(lastSentAt: Date | null, now = Date.now()): Date | null {
  if (!lastSentAt) return null;
  const next = new Date(lastSentAt.getTime() + EMAIL_CAP_MS);
  return next.getTime() > now ? next : null;
}

const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);

/** How long a running approval holds the row. Its calls to the app take seconds; this only frees one that died. */
const APPROVAL_LEASE_MINUTES = 5;

/** True while an approval is running on the row `a`, as a SQL expression. */
const approvalHeld = (sql: Sql) =>
  sql`(a.approval_token is not null and a.approval_started_at > now() - make_interval(mins => ${APPROVAL_LEASE_MINUTES}))`;

/** True if `a` can't be changed: being approved, or its email may have gone out. */
const locked = (sql: Sql) => sql`(${approvalHeld(sql)} or a.send_requested_at is not null)`;

const lock = (tx: Tx) => tx`select pg_advisory_xact_lock(hashtextextended('blog.announcement', 0))`;

/** A scheduled post whose moment has passed is live, as the blog itself reads it. */
const effectivePostStatus = (sql: Sql) =>
  sql`(case when p.status = 'scheduled' and p.published_at <= now() then 'published' else p.status end)`;

/* ─── For the app ────────────────────────────────────────────────────── */

export type AnnouncementState = {
  lastRef: string | null;
  lastEmailSentAt: string | null;
  nextEmailAt: string | null;
  pending: { id: string; releaseRef: string; sinceRef: string | null; updatedAt: string } | null;
};

/**
 * Where the app should start its next announcement, and whether one is
 * waiting.
 *
 * `lastRef` is the release of the newest announcement that is no longer
 * pending: approved, skipped and discarded all mean "these notes have been
 * dealt with". They are ordered by when they were settled, which is the order
 * they happened in, since only one can be pending at a time and a skip is
 * refused while one is.
 */
export async function announcementState(): Promise<AnnouncementState> {
  const sql = requireSql();
  const [row] = await sql<
    {
      last_ref: string | null;
      last_email_sent_at: Date | null;
      pending_id: string | null;
      pending_release_ref: string | null;
      pending_since_ref: string | null;
      pending_updated_at: Date | null;
    }[]
  >`
    select
      (
        select release_ref from blog.announcement
        where status <> 'pending'
        order by coalesce(approved_at, discarded_at, created_at) desc, created_at desc
        limit 1
      ) as last_ref,
      (select max(email_sent_at) from blog.announcement) as last_email_sent_at,
      pending.id as pending_id,
      pending.release_ref as pending_release_ref,
      pending.since_ref as pending_since_ref,
      pending.updated_at as pending_updated_at
    from (select 1) as one
    left join blog.announcement pending on pending.status = 'pending'
  `;

  const lastSent = row.last_email_sent_at ? new Date(row.last_email_sent_at) : null;
  return {
    lastRef: row.last_ref,
    lastEmailSentAt: iso(lastSent),
    nextEmailAt: iso(nextEmailAt(lastSent)),
    pending:
      row.pending_id && row.pending_release_ref
        ? {
            id: row.pending_id,
            releaseRef: row.pending_release_ref,
            sinceRef: row.pending_since_ref,
            updatedAt: iso(row.pending_updated_at) ?? "",
          }
        : null,
  };
}

/** A draft the API should refuse with a 400: something only visible after sanitising. */
export class InvalidDraftError extends Error {}

/** A draft the API should refuse with a 409: the pending one is being approved right now. */
export class AnnouncementBusyError extends Error {}

/**
 * Writes the app's draft: creates the one pending announcement, or replaces
 * the pending one's content (a newer release supersedes it; the app has
 * regenerated from everything since `lastRef`).
 *
 * The post it owns stays a draft. On a replace, that same post is rewritten,
 * keeping the byline and category somebody may have chosen in the editor; if
 * it was published or deleted meanwhile, a fresh draft is made instead and the
 * published one is left alone.
 */
export async function saveDraft(input: DraftInput): Promise<{ id: string; postId: string; replaced: boolean }> {
  const sql = requireSql();

  const blog = input.blog;
  const content = blog ? sanitizeContent(blog.html) : "";
  if (blog && !htmlToText(content) && !/<img\b/i.test(content)) {
    throw new InvalidDraftError("blog.html: nothing is left once the HTML is sanitised");
  }
  const ctaLabel = input.email.ctaLabel || DEFAULT_CTA_LABEL;

  return transaction(sql, async (tx) => {
    await lock(tx);

    const [pending] = await tx<{ id: string; post_id: string | null; held: boolean }[]>`
      select a.id, a.post_id, ${locked(tx)} as held
      from blog.announcement a where a.status = 'pending' for update
    `;
    if (pending?.held) {
      throw new AnnouncementBusyError("The pending announcement is being approved, or its email has been sent. Settle it in the admin first.");
    }

    let post: { id: string; author_id: string | null; category_id: string | null } | undefined;
    if (pending?.post_id) {
      [post] = await tx<{ id: string; author_id: string | null; category_id: string | null }[]>`
        select id, author_id, category_id from blog.post
        where id = ${pending.post_id} and status = 'draft'
        for update
      `;
    }

    let savedId: string;
    if (blog) {
      const excerpt = blog.excerpt || null;
      const seoDescription = blog.seoDescription || null;
      const categoryId = post?.category_id ?? (await productUpdatesCategory(tx));
      const authorId = post?.author_id ?? (await defaultAuthor(tx));
      const slug = await freeSlug(tx, blog.title, post?.id ?? null);

      const [saved] = post
        ? await tx<{ id: string }[]>`
            update blog.post set
              title = ${blog.title},
              slug = ${slug},
              excerpt = ${excerpt},
              content = ${content},
              seo_description = ${seoDescription},
              author_id = ${authorId},
              category_id = ${categoryId},
              updated_at = now()
            where id = ${post.id}
            returning id
          `
        : await tx<{ id: string }[]>`
            insert into blog.post (title, slug, excerpt, content, seo_description, author_id, category_id, status)
            values (${blog.title}, ${slug}, ${excerpt}, ${content}, ${seoDescription}, ${authorId}, ${categoryId}, 'draft')
            returning id
          `;
      savedId = saved.id;
    } else {
      /* A post already on the blog, used as it is. A draft the pending row had
         written for itself is no longer anyone's, so it goes. */
      const [existing] = await tx<{ id: string }[]>`select id from blog.post where slug = ${input.postSlug ?? ""}`;
      if (!existing) throw new InvalidDraftError(`postSlug: no post has the slug ${input.postSlug}`);
      savedId = existing.id;
      if (post && post.id !== savedId) await tx`delete from blog.post where id = ${post.id}`;
    }

    const notes = tx.array(input.notes);
    const email = tx.json(input.email.announcement);
    const [row] = pending
      ? await tx<{ id: string }[]>`
          update blog.announcement set
            since_ref = ${input.sinceRef},
            release_ref = ${input.releaseRef},
            notes = ${notes}::text[],
            post_id = ${savedId},
            email_subject = ${input.email.subject},
            email_content = ${email},
            email_cta_label = ${ctaLabel},
            draft_version = draft_version + 1,
            approval_token = null,
            approval_started_at = null,
            last_error = null,
            updated_at = now()
          where id = ${pending.id}
          returning id
        `
      : await tx<{ id: string }[]>`
          insert into blog.announcement (
            status, since_ref, release_ref, notes, post_id, email_subject, email_content, email_cta_label
          ) values (
            'pending', ${input.sinceRef}, ${input.releaseRef}, ${notes}::text[], ${savedId},
            ${input.email.subject}, ${email}, ${ctaLabel}
          )
          returning id
        `;

    return { id: row.id, postId: savedId, replaced: Boolean(pending) };
  });
}

/** The "Product updates" category, made the first time it is needed. */
async function productUpdatesCategory(tx: Tx): Promise<string> {
  await tx`
    insert into blog.category (name, slug, description)
    values (${CATEGORY.name}, ${CATEGORY.slug}, ${CATEGORY.description})
    on conflict (slug) do nothing
  `;
  const [row] = await tx<{ id: string }[]>`select id from blog.category where slug = ${CATEGORY.slug}`;
  return row.id;
}

/**
 * The byline for an announcement: a "Growsearch team" author if there is one,
 * otherwise whoever has written the most posts, so release notes read as from
 * the people who already write the blog. Only an empty authors list makes a
 * new one.
 */
async function defaultAuthor(tx: Tx): Promise<string> {
  const [existing] = await tx<{ id: string }[]>`
    select a.id from blog.author a
    order by (a.slug = ${DEFAULT_AUTHOR.slug}) desc,
             (select count(*) from blog.post p where p.author_id = a.id) desc,
             a.id asc
    limit 1
  `;
  if (existing) return existing.id;

  await tx`
    insert into blog.author (name, slug) values (${DEFAULT_AUTHOR.name}, ${DEFAULT_AUTHOR.slug})
    on conflict (slug) do nothing
  `;
  const [row] = await tx<{ id: string }[]>`select id from blog.author where slug = ${DEFAULT_AUTHOR.slug}`;
  return row.id;
}

/** A slug from the title that no other post uses, the way the blog editor makes one. */
async function freeSlug(tx: Tx, title: string, ownId: string | null): Promise<string> {
  let base = slugify(title) || "product-update";
  if (RESERVED_POST_SLUGS.has(base)) base = `${base}-update`;
  const taken = await tx<{ slug: string }[]>`
    select slug from blog.post
    where (slug = ${base} or slug like ${slugFamilyPattern(base)}) and id <> ${ownId ?? "0"}
  `;
  return nextFreeSlug(base, taken.map((row) => row.slug));
}

export type SkipOutcome = { ok: true; id: string } | { ok: false; pendingId: string };

/**
 * Records that the app looked at these notes and found nothing worth telling
 * merchants. Moves `lastRef` on; publishes and sends nothing. Refused while an
 * announcement is pending, which covers the same notes and would be stranded.
 *
 * A retried skip (the app's request timed out after we had committed) finds
 * its own row and returns it rather than adding a second.
 */
export async function recordSkip(input: SkipInput): Promise<SkipOutcome> {
  const sql = requireSql();
  return transaction(sql, async (tx) => {
    await lock(tx);

    const [pending] = await tx<{ id: string }[]>`select id from blog.announcement where status = 'pending'`;
    if (pending) return { ok: false, pendingId: pending.id };

    const [last] = await tx<{ id: string; status: AnnouncementStatus; release_ref: string; since_ref: string | null }[]>`
      select id, status, release_ref, since_ref from blog.announcement
      order by coalesce(approved_at, discarded_at, created_at) desc, created_at desc
      limit 1
    `;
    if (last?.status === "skipped" && last.release_ref === input.releaseRef && last.since_ref === input.sinceRef) {
      return { ok: true, id: last.id };
    }

    const [row] = await tx<{ id: string }[]>`
      insert into blog.announcement (status, since_ref, release_ref, notes, reason)
      values ('skipped', ${input.sinceRef}, ${input.releaseRef}, ${tx.array(input.notes)}::text[], ${input.reason || null})
      returning id
    `;
    return { ok: true, id: row.id };
  });
}

/* ─── For the admin ──────────────────────────────────────────────────── */

export type AnnouncementPost = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  excerpt: string | null;
  publishedAt: string | null;
};

export type Announcement = {
  id: string;
  status: AnnouncementStatus;
  sinceRef: string | null;
  releaseRef: string;
  notes: string[];
  post: AnnouncementPost | null;
  emailSubject: string | null;
  emailContent: AnnouncementContent | null;
  emailCtaLabel: string | null;
  campaignId: string;
  draftVersion: number;
  /** Set: the email may have gone out, and only Approve can settle it. */
  sendRequestedAt: string | null;
  reason: string | null;
  lastError: string | null;
  emailRecipients: number | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  emailSentAt: string | null;
  discardedAt: string | null;
  discardedBy: string | null;
};

export type AnnouncementsView = {
  /** With the post's sanitised HTML, for the preview. */
  pending: (Announcement & { postHtml: string | null }) | null;
  history: Announcement[];
  lastEmailSentAt: string | null;
  /** When the next email may go out, or null if it may go now. */
  nextEmailAt: string | null;
};

type Row = {
  id: string;
  status: AnnouncementStatus;
  since_ref: string | null;
  release_ref: string;
  notes: string[];
  post_id: string | null;
  email_subject: string | null;
  email_content: AnnouncementContent | null;
  email_cta_label: string | null;
  campaign_id: string;
  draft_version: number;
  send_requested_at: Date | null;
  reason: string | null;
  last_error: string | null;
  email_recipients: number | null;
  created_at: Date;
  updated_at: Date;
  approved_at: Date | null;
  approved_by: string | null;
  email_sent_at: Date | null;
  discarded_at: Date | null;
  discarded_by: string | null;
  post_title: string | null;
  post_slug: string | null;
  post_status: PostStatus | null;
  post_excerpt: string | null;
  post_published_at: Date | null;
  post_content: string | null;
  last_email_sent_at: Date | null;
};

const HISTORY_LIMIT = 50;

function toAnnouncement(row: Row): Announcement {
  return {
    id: row.id,
    status: row.status,
    sinceRef: row.since_ref,
    releaseRef: row.release_ref,
    notes: row.notes ?? [],
    post:
      row.post_id && row.post_slug && row.post_status
        ? {
            id: row.post_id,
            title: row.post_title ?? "",
            slug: row.post_slug,
            status: row.post_status,
            excerpt: row.post_excerpt,
            publishedAt: iso(row.post_published_at),
          }
        : null,
    emailSubject: row.email_subject,
    emailContent: row.email_content,
    emailCtaLabel: row.email_cta_label,
    campaignId: row.campaign_id,
    draftVersion: row.draft_version,
    sendRequestedAt: iso(row.send_requested_at),
    reason: row.reason,
    lastError: row.last_error,
    emailRecipients: row.email_recipients,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    approvedAt: iso(row.approved_at),
    approvedBy: row.approved_by,
    emailSentAt: iso(row.email_sent_at),
    discardedAt: iso(row.discarded_at),
    discardedBy: row.discarded_by,
  };
}

/** Everything the admin page shows, in one statement. */
export async function announcementsView(): Promise<AnnouncementsView> {
  const sql = requireSql();
  const rows = await sql<Row[]>`
    select a.*,
           p.title as post_title, p.slug as post_slug, ${effectivePostStatus(sql)} as post_status,
           p.excerpt as post_excerpt, p.published_at as post_published_at,
           case when a.status = 'pending' then p.content end as post_content,
           (select max(email_sent_at) from blog.announcement) as last_email_sent_at
    from blog.announcement a
    left join blog.post p on p.id = a.post_id
    order by (a.status = 'pending') desc, coalesce(a.approved_at, a.discarded_at, a.created_at) desc, a.created_at desc
    limit ${HISTORY_LIMIT + 1}
  `;

  const pendingRow = rows.find((row) => row.status === "pending");
  const lastSent = rows[0]?.last_email_sent_at ? new Date(rows[0].last_email_sent_at) : null;
  return {
    pending: pendingRow
      ? {
          ...toAnnouncement(pendingRow),
          /* Sanitised again on the way out, as the blog does on render. */
          postHtml: pendingRow.post_content === null ? null : sanitizeContent(pendingRow.post_content),
        }
      : null,
    history: rows
      .filter((row) => row.status !== "pending")
      .slice(0, HISTORY_LIMIT)
      .map(toAnnouncement),
    lastEmailSentAt: iso(lastSent),
    nextEmailAt: iso(nextEmailAt(lastSent)),
  };
}

export type EmailFields = { subject: string; content: AnnouncementContent; ctaLabel: string };

/**
 * Saves the email as edited on the admin page, if the row is still the version
 * the form was opened on and no approval is running. Answers the new version,
 * or null if it wasn't saved.
 *
 * Leaves `updated_at` alone, as `recordApprovalError` does: while a row is
 * pending, that is when the app last drafted it (the "Last changed" on the
 * page, `updatedAt` in `status`, and what remounts the page's form with the
 * app's new text).
 */
export async function saveEmail(id: string, version: number, fields: EmailFields): Promise<number | null> {
  const sql = requireSql();
  const [row] = await sql<{ draft_version: number }[]>`
    update blog.announcement a set
      email_subject = ${fields.subject},
      email_content = ${sql.json(fields.content)},
      email_cta_label = ${fields.ctaLabel || DEFAULT_CTA_LABEL},
      draft_version = a.draft_version + 1
    where a.id = ${id} and a.status = 'pending' and a.draft_version = ${version} and not ${locked(sql)}
    returning a.draft_version
  `;
  return row?.draft_version ?? null;
}

export type ApprovalClaim =
  | { ok: true; token: string }
  | { ok: false; reason: "changed" }
  | { ok: false; reason: "capped"; lastSentAt: Date; nextAt: Date };

/**
 * Starts an approval: the row must still be the version that was read, nothing
 * else may be approving it, and the seven-day cap must allow an email. From here
 * until `markApproved` or `releaseApproval`, no draft, edit or discard can change
 * it, so what is sent is what was read and the release it records is the one
 * that was sent.
 */
export async function claimApproval(id: string, version: number): Promise<ApprovalClaim> {
  const sql = requireSql();
  return transaction(sql, async (tx) => {
    await lock(tx);
    const [row] = await tx<{ id: string; last_sent: Date | null }[]>`
      select a.id, (select max(coalesce(o.email_sent_at, o.send_requested_at)) from blog.announcement o where o.id <> a.id) as last_sent
      from blog.announcement a
      where a.id = ${id} and a.status = 'pending' and a.draft_version = ${version} and not ${locked(tx)}
      for update
    `;
    if (!row) return { ok: false, reason: "changed" } as const;

    const lastSentAt = row.last_sent ? new Date(row.last_sent) : null;
    const nextAt = nextEmailAt(lastSentAt);
    if (lastSentAt && nextAt) return { ok: false, reason: "capped", lastSentAt, nextAt } as const;

    const [claimed] = await tx<{ approval_token: string }[]>`
      update blog.announcement set approval_token = gen_random_uuid(), approval_started_at = now()
      where id = ${row.id}
      returning approval_token
    `;
    return { ok: true, token: claimed.approval_token } as const;
  });
}

/**
 * Records that the campaign is about to go to the app. From here the email may
 * go out whatever we hear back. False if this approval no longer holds the row.
 */
export async function requestSend(id: string, token: string): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`
    update blog.announcement set send_requested_at = coalesce(send_requested_at, now())
    where id = ${id} and status = 'pending' and approval_token = ${token}
    returning id
  `;
  return rows.length > 0;
}

/**
 * Ends an approval that did not finish. `error` stays on the row until one
 * succeeds. `sendRefused` says the app turned down this approval's own request,
 * the only one there has been, so the row can be changed again; anything less
 * leaves it locked for `settleSent` or `clearSendRequest`.
 */
export async function releaseApproval(
  id: string,
  token: string,
  error: string | null,
  { sendRefused = false }: { sendRefused?: boolean } = {},
): Promise<void> {
  const sql = requireSql();
  await sql`
    update blog.announcement set
      approval_token = null,
      approval_started_at = null,
      send_requested_at = case when ${sendRefused} then null else send_requested_at end,
      last_error = coalesce(${error?.slice(0, 1000) ?? null}, last_error)
    where id = ${id} and approval_token = ${token}
  `;
}

export type UnsettledSend = { id: string; campaignId: string; postTitle: string | null };

/**
 * The announcement whose send is waiting to be settled, or null if there is none
 * or an approval is still running on it (its request may still be on the way, so
 * the app's "I don't have that campaign" wouldn't mean anything yet).
 */
export async function unsettledSend(id: string): Promise<UnsettledSend | null> {
  const sql = requireSql();
  const [row] = await sql<{ id: string; campaign_id: string; post_title: string | null }[]>`
    select a.id, a.campaign_id, p.title as post_title
    from blog.announcement a
    left join blog.post p on p.id = a.post_id
    where a.id = ${id} and a.status = 'pending' and a.send_requested_at is not null and not ${approvalHeld(sql)}
  `;
  return row ? { id: row.id, campaignId: row.campaign_id, postTitle: row.post_title } : null;
}

/**
 * The app has the campaign, so the email went: record it, whatever became of the
 * post. Both settlements name the campaign that was asked about, so a late answer
 * about an old one can't touch a newer send.
 */
export async function settleSent(
  id: string,
  campaignId: string,
  approvedBy: string,
  recipients: number | null,
): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`
    update blog.announcement set
      status = 'approved',
      approved_at = now(),
      approved_by = ${approvedBy},
      email_sent_at = now(),
      email_recipients = ${recipients},
      approval_token = null,
      approval_started_at = null,
      last_error = null,
      updated_at = now()
    where id = ${id} and status = 'pending' and send_requested_at is not null and campaign_id = ${campaignId}
    returning id
  `;
  return rows.length > 0;
}

/**
 * The app confirms it never got the campaign and has withdrawn its id, so nothing
 * went. The row is free again, with a new id for its next attempt.
 */
export async function clearSendRequest(id: string, campaignId: string): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`
    update blog.announcement set send_requested_at = null, campaign_id = gen_random_uuid(), last_error = null
    where id = ${id} and status = 'pending' and send_requested_at is not null and campaign_id = ${campaignId}
    returning id
  `;
  return rows.length > 0;
}

export type ApprovalTarget = {
  id: string;
  campaignId: string;
  subject: string;
  content: AnnouncementContent;
  ctaLabel: string;
  post: { id: string; title: string; slug: string; status: PostStatus } | null;
  /** The newest email any *other* announcement sent: the seven-day cap. */
  lastEmailSentAt: string | null;
};

/** The pending announcement with this id, and what approving it needs. Null if it is not pending. */
export async function approvalTarget(id: string): Promise<ApprovalTarget | null> {
  const sql = requireSql();
  const [row] = await sql<
    {
      id: string;
      campaign_id: string;
      email_subject: string;
      email_content: AnnouncementContent;
      email_cta_label: string | null;
      post_id: string | null;
      post_title: string | null;
      post_slug: string | null;
      post_status: PostStatus | null;
      last_sent: Date | null;
    }[]
  >`
    select a.id, a.campaign_id, a.email_subject, a.email_content, a.email_cta_label,
           p.id as post_id, p.title as post_title, p.slug as post_slug, ${effectivePostStatus(sql)} as post_status,
           (select max(o.email_sent_at) from blog.announcement o where o.id <> a.id) as last_sent
    from blog.announcement a
    left join blog.post p on p.id = a.post_id
    where a.id = ${id} and a.status = 'pending'
  `;
  if (!row) return null;
  return {
    id: row.id,
    campaignId: row.campaign_id,
    subject: row.email_subject,
    content: row.email_content,
    ctaLabel: row.email_cta_label || DEFAULT_CTA_LABEL,
    post:
      row.post_id && row.post_slug && row.post_status
        ? { id: row.post_id, title: row.post_title ?? "", slug: row.post_slug, status: row.post_status }
        : null,
    lastEmailSentAt: iso(row.last_sent),
  };
}

/**
 * The last step of an approval, once the post is live and the app has the
 * campaign. False if this approval no longer holds the row, which takes a lease
 * that lapsed and somebody acting on it. The send is recorded on the row even
 * then, so the seven-day cap still counts it.
 */
export async function markApproved(
  id: string,
  token: string,
  approvedBy: string,
  recipients: number | null,
): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`
    update blog.announcement set
      status = 'approved',
      approved_at = now(),
      approved_by = ${approvedBy},
      email_sent_at = now(),
      email_recipients = ${recipients},
      approval_token = null,
      approval_started_at = null,
      last_error = null,
      updated_at = now()
    where id = ${id} and status = 'pending' and approval_token = ${token}
    returning id
  `;
  if (rows.length > 0) return true;
  await sql`
    update blog.announcement set
      email_sent_at = coalesce(email_sent_at, now()),
      email_recipients = ${recipients}
    where id = ${id}
  `;
  return false;
}

/**
 * Throws the pending announcement away: its notes count as dealt with, and
 * its post goes too if it is still a draft. A post somebody published by hand
 * meanwhile stays published.
 */
export async function discardAnnouncement(
  id: string,
  discardedBy: string,
): Promise<{ ok: true; deletedPostSlug: string | null; releaseRef: string } | { ok: false; busy: boolean }> {
  const sql = requireSql();
  return transaction(sql, async (tx) => {
    await lock(tx);
    const [row] = await tx<{ id: string; post_id: string | null; release_ref: string; held: boolean }[]>`
      select a.id, a.post_id, a.release_ref, ${locked(tx)} as held
      from blog.announcement a where a.id = ${id} and a.status = 'pending' for update
    `;
    if (!row) return { ok: false, busy: false } as const;
    if (row.held) return { ok: false, busy: true } as const;

    let deletedPostSlug: string | null = null;
    if (row.post_id) {
      const [deleted] = await tx<{ slug: string }[]>`
        delete from blog.post where id = ${row.post_id} and status = 'draft' returning slug
      `;
      deletedPostSlug = deleted?.slug ?? null;
    }

    await tx`
      update blog.announcement set
        status = 'discarded',
        discarded_at = now(),
        discarded_by = ${discardedBy},
        last_error = null,
        updated_at = now()
      where id = ${row.id}
    `;
    return { ok: true, deletedPostSlug, releaseRef: row.release_ref } as const;
  });
}
