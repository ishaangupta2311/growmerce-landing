import "server-only";

import type { Sql } from "postgres";

import { htmlToText, sanitizeContent } from "@/lib/blog/sanitize";
import { nextFreeSlug, slugFamilyPattern, slugify } from "@/lib/blog/slug";
import { requireSql } from "@/lib/blog/sql";
import type { PostStatus } from "@/lib/blog/types";
import { RESERVED_POST_SLUGS } from "@/lib/blog/validation";
import { transaction, type Tx } from "@/lib/db";
import { SITE_ORIGIN } from "@/lib/site-urls";
import { DEFAULT_CTA_LABEL, type DraftInput, type SkipInput } from "./contract";

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

  const content = sanitizeContent(input.blog.html);
  if (!htmlToText(content) && !/<img\b/i.test(content)) {
    throw new InvalidDraftError("blog.html: nothing is left once the HTML is sanitised");
  }
  const excerpt = input.blog.excerpt || null;
  const seoDescription = input.blog.seoDescription || null;
  const ctaLabel = input.email.ctaLabel || DEFAULT_CTA_LABEL;

  return transaction(sql, async (tx) => {
    await lock(tx);

    const [pending] = await tx<{ id: string; post_id: string | null }[]>`
      select id, post_id from blog.announcement where status = 'pending' for update
    `;

    let post: { id: string; author_id: string | null; category_id: string | null } | undefined;
    if (pending?.post_id) {
      [post] = await tx<{ id: string; author_id: string | null; category_id: string | null }[]>`
        select id, author_id, category_id from blog.post
        where id = ${pending.post_id} and status = 'draft'
        for update
      `;
    }

    const categoryId = post?.category_id ?? (await productUpdatesCategory(tx));
    const authorId = post?.author_id ?? (await defaultAuthor(tx));
    const slug = await freeSlug(tx, input.blog.title, post?.id ?? null);

    const [saved] = post
      ? await tx<{ id: string }[]>`
          update blog.post set
            title = ${input.blog.title},
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
          values (${input.blog.title}, ${slug}, ${excerpt}, ${content}, ${seoDescription}, ${authorId}, ${categoryId}, 'draft')
          returning id
        `;

    const notes = tx.array(input.notes);
    const [row] = pending
      ? await tx<{ id: string }[]>`
          update blog.announcement set
            since_ref = ${input.sinceRef},
            release_ref = ${input.releaseRef},
            notes = ${notes}::text[],
            post_id = ${saved.id},
            email_subject = ${input.email.subject},
            email_body = ${input.email.body},
            email_cta_label = ${ctaLabel},
            last_error = null,
            updated_at = now()
          where id = ${pending.id}
          returning id
        `
      : await tx<{ id: string }[]>`
          insert into blog.announcement (
            status, since_ref, release_ref, notes, post_id, email_subject, email_body, email_cta_label
          ) values (
            'pending', ${input.sinceRef}, ${input.releaseRef}, ${notes}::text[], ${saved.id},
            ${input.email.subject}, ${input.email.body}, ${ctaLabel}
          )
          returning id
        `;

    return { id: row.id, postId: saved.id, replaced: Boolean(pending) };
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
  emailBody: string | null;
  emailCtaLabel: string | null;
  campaignId: string;
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
  email_body: string | null;
  email_cta_label: string | null;
  campaign_id: string;
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
    emailBody: row.email_body,
    emailCtaLabel: row.email_cta_label,
    campaignId: row.campaign_id,
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

export type EmailFields = { subject: string; body: string; ctaLabel: string };

/**
 * Saves the email as edited on the admin page. False when it is no longer
 * pending.
 *
 * Leaves `updated_at` alone, as `recordApprovalError` does: while a row is
 * pending, that is when the app last drafted it (the "Last changed" on the
 * page, `updatedAt` in `status`, and what remounts the page's form with the
 * app's new text).
 */
export async function saveEmail(id: string, fields: EmailFields): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`
    update blog.announcement set
      email_subject = ${fields.subject},
      email_body = ${fields.body},
      email_cta_label = ${fields.ctaLabel || DEFAULT_CTA_LABEL}
    where id = ${id} and status = 'pending'
    returning id
  `;
  return rows.length > 0;
}

export type ApprovalTarget = {
  id: string;
  campaignId: string;
  subject: string;
  body: string;
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
      email_body: string;
      email_cta_label: string | null;
      post_id: string | null;
      post_title: string | null;
      post_slug: string | null;
      post_status: PostStatus | null;
      last_sent: Date | null;
    }[]
  >`
    select a.id, a.campaign_id, a.email_subject, a.email_body, a.email_cta_label,
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
    body: row.email_body,
    ctaLabel: row.email_cta_label || DEFAULT_CTA_LABEL,
    post:
      row.post_id && row.post_slug && row.post_status
        ? { id: row.post_id, title: row.post_title ?? "", slug: row.post_slug, status: row.post_status }
        : null,
    lastEmailSentAt: iso(row.last_sent),
  };
}

/** Keeps a failed approval's reason on the row, so the page still says it after a reload. */
export async function recordApprovalError(id: string, error: string): Promise<void> {
  const sql = requireSql();
  await sql`
    update blog.announcement set last_error = ${error.slice(0, 1000)}
    where id = ${id} and status = 'pending'
  `;
}

/**
 * The last step of an approval, once the post is live and the app has the
 * campaign. `postId` is the post that was published: if a new draft arrived
 * mid-approval and pointed the row at a fresh post, the row is pointed back
 * at what merchants were actually sent to.
 */
export async function markApproved(
  id: string,
  approvedBy: string,
  postId: string,
  recipients: number | null,
): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`
    update blog.announcement set
      status = 'approved',
      post_id = ${postId},
      approved_at = now(),
      approved_by = ${approvedBy},
      email_sent_at = now(),
      email_recipients = ${recipients},
      last_error = null,
      updated_at = now()
    where id = ${id} and status = 'pending'
    returning id
  `;
  return rows.length > 0;
}

/**
 * Throws the pending announcement away: its notes count as dealt with, and
 * its post goes too if it is still a draft. A post somebody published by hand
 * meanwhile stays published.
 */
export async function discardAnnouncement(
  id: string,
  discardedBy: string,
): Promise<{ ok: true; deletedPostSlug: string | null; releaseRef: string } | { ok: false }> {
  const sql = requireSql();
  return transaction(sql, async (tx) => {
    await lock(tx);
    const [row] = await tx<{ id: string; post_id: string | null; release_ref: string }[]>`
      select id, post_id, release_ref from blog.announcement where id = ${id} and status = 'pending' for update
    `;
    if (!row) return { ok: false } as const;

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
