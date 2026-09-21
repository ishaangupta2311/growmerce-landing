import "server-only";

import type { Sql } from "postgres";
import { sanitizeContent } from "./sanitize";
import { nextFreeSlug, slugFamilyPattern, slugify } from "./slug";
import { requireSql, uniqueViolation } from "./sql";
import type {
  AdminPostRow,
  EditablePost,
  PostIntent,
  PostSort,
  PostStatus,
  TwitterCard,
} from "./types";
import type { PostInput } from "./validation";

/**
 * Admin-side reads and writes for posts. Every caller has already passed
 * `requireAdmin()`; nothing here checks who is asking.
 *
 * Written for round trips, not just correctness: from a developer machine
 * the database can be a few hundred milliseconds away, so every function
 * here is one statement where it can be — a page that waited on five
 * sequential queries took a second and a half before it drew anything.
 */

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  og_image: string | null;
  twitter_card: TwitterCard;
  author_id: string | null;
  category_id: string | null;
  status: PostStatus;
  published_at: Date | null;
  scheduled_at: Date | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  canonical_url: string | null;
  created_at: Date;
  updated_at: Date;
};

const iso = (value: Date | string | null) => (value ? new Date(value).toISOString() : null);

/**
 * A scheduled post whose moment has passed is live — public reads already
 * treat it so (src/lib/blog/public.ts) — and the admin panel should say what
 * readers see. Computed in the query rather than written back on every page
 * view; the row itself becomes `published` the next time it is saved.
 */
const effectiveStatus = (sql: Sql) =>
  sql`(case when p.status = 'scheduled' and p.published_at <= now() then 'published' else p.status end)`;

export type PostListQuery = {
  q: string;
  status: PostStatus | "all";
  categoryId: string | null;
  sort: PostSort;
  page: number;
  pageSize: number;
};

type ListRow = Pick<PostRow, "id" | "title" | "slug" | "status" | "featured_image" | "published_at" | "scheduled_at" | "updated_at"> & {
  author_name: string | null;
  category_name: string | null;
  total: number;
};

export async function listAdminPosts(query: PostListQuery) {
  const sql = requireSql();
  const status = effectiveStatus(sql);

  let where = sql`true`;
  if (query.q) {
    const pattern = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
    where = sql`${where} and (p.title ilike ${pattern} or p.slug ilike ${pattern})`;
  }
  if (query.status !== "all") where = sql`${where} and ${status} = ${query.status}`;
  if (query.categoryId === "none") where = sql`${where} and p.category_id is null`;
  else if (query.categoryId) where = sql`${where} and p.category_id = ${query.categoryId}`;

  const order = {
    updated_desc: sql`p.updated_at desc, p.id desc`,
    updated_asc: sql`p.updated_at asc, p.id asc`,
    published_desc: sql`p.published_at desc nulls last, p.id desc`,
    published_asc: sql`p.published_at asc nulls last, p.id asc`,
    created_desc: sql`p.created_at desc, p.id desc`,
    title_asc: sql`lower(p.title) asc, p.id asc`,
    title_desc: sql`lower(p.title) desc, p.id desc`,
  }[query.sort];

  /* Rows and total in one trip: the window count rides along on every row. */
  const fetchPage = (page: number) => sql<ListRow[]>`
    select p.id, p.title, p.slug, ${status} as status, p.featured_image, p.published_at,
           p.scheduled_at, p.updated_at, a.name as author_name, c.name as category_name,
           count(*) over ()::int as total
    from blog.post p
    left join blog.author a on a.id = p.author_id
    left join blog.category c on c.id = p.category_id
    where ${where}
    order by ${order}
    limit ${query.pageSize} offset ${(page - 1) * query.pageSize}
  `;

  let page = Math.max(1, query.page);
  let rows = await fetchPage(page);
  let total = rows[0]?.total ?? 0;

  /* Past the end (a stale ?page= after deletes): find the real last page.
     Rare, so the extra trips are only paid here. */
  if (rows.length === 0 && page > 1) {
    const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from blog.post p where ${where}`;
    total = count;
    page = Math.max(1, Math.ceil(total / query.pageSize));
    rows = total > 0 ? await fetchPage(page) : rows;
  }

  const items: AdminPostRow[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    featuredImage: row.featured_image,
    authorName: row.author_name,
    categoryName: row.category_name,
    publishedAt: iso(row.published_at),
    scheduledAt: iso(row.scheduled_at),
    updatedAt: row.updated_at.toISOString(),
  }));

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / query.pageSize)) };
}

type SummaryRow = { id: string; title: string; slug: string; status: PostStatus; published_at: string | null; updated_at: string };

/** Everything the dashboard shows, in one statement. */
export async function getDashboard() {
  const sql = requireSql();
  const [row] = await sql<
    {
      total: number;
      published: number;
      draft: number;
      scheduled: number;
      categories: number;
      tags: number;
      media: number;
      recently_published: SummaryRow[];
      recently_updated: SummaryRow[];
    }[]
  >`
    with p as (
      select p.id::text as id, p.title, p.slug, ${effectiveStatus(sql)} as status, p.published_at, p.updated_at
      from blog.post p
    )
    select
      (select count(*)::int from p) as total,
      (select count(*)::int from p where status = 'published') as published,
      (select count(*)::int from p where status = 'draft') as draft,
      (select count(*)::int from p where status = 'scheduled') as scheduled,
      (select count(*)::int from blog.category) as categories,
      (select count(*)::int from blog.tag) as tags,
      (select count(*)::int from blog.media) as media,
      coalesce((
        select json_agg(r) from (
          select * from p where status = 'published' order by published_at desc limit 5
        ) r
      ), '[]') as recently_published,
      coalesce((
        select json_agg(r) from (select * from p order by updated_at desc limit 5) r
      ), '[]') as recently_updated
  `;

  const summary = (rows: SummaryRow[]) =>
    rows.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status,
      publishedAt: iso(item.published_at),
      updatedAt: iso(item.updated_at) ?? "",
    }));

  return {
    counts: { total: row.total, published: row.published, draft: row.draft, scheduled: row.scheduled },
    extras: { categories: row.categories, tags: row.tags, media: row.media },
    recentlyPublished: summary(row.recently_published),
    recentlyUpdated: summary(row.recently_updated),
  };
}

export async function getEditablePost(id: string): Promise<EditablePost | null> {
  const sql = requireSql();
  const [row] = await sql<(PostRow & { effective_status: PostStatus; tag_ids: string[] })[]>`
    select p.*, ${effectiveStatus(sql)} as effective_status,
           array(select pt.tag_id::text from blog.post_tag pt where pt.post_id = p.id) as tag_ids
    from blog.post p
    where p.id = ${id}
  `;
  if (!row) return null;

  const status = row.effective_status;
  return {
    id: row.id,
    status,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    content: row.content,
    featuredImage: row.featured_image ?? "",
    ogImage: row.og_image ?? "",
    twitterCard: row.twitter_card,
    authorId: row.author_id ?? "",
    categoryId: row.category_id ?? "",
    tagIds: row.tag_ids,
    /* A scheduled post's published_at is only its go-live moment, which the
       schedule field already shows. */
    publishedAt: status === "scheduled" ? "" : (iso(row.published_at) ?? ""),
    /* Once live, the schedule has done its job. */
    scheduledAt: status === "scheduled" ? (iso(row.scheduled_at) ?? "") : "",
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    seoKeywords: row.seo_keywords ?? "",
    canonicalUrl: row.canonical_url ?? "",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export type SaveOutcome =
  | { ok: true; id: string; slug: string; status: PostStatus; previousSlug: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Clock slack for "publish now" when the browser clock runs a little fast. */
const CLOCK_SKEW_MS = 60_000;

/**
 * Creates or updates a post and decides its status from the button pressed.
 *
 *   draft      saved, not public (also "revert to draft")
 *   update     saved, keeping whatever status it already had
 *   publish    public now, or at a past publish date if one was given
 *   schedule   public automatically at `scheduledAt`
 *   unpublish  back to draft; the original publish date is kept for next time
 */
export async function savePost(
  adminId: string,
  postId: string | null,
  input: PostInput,
  intent: PostIntent,
): Promise<SaveOutcome> {
  const sql = requireSql();

  let existing: { status: PostStatus; published_at: Date | null; slug: string } | undefined;
  if (postId) {
    [existing] = await sql<{ status: PostStatus; published_at: Date | null; slug: string }[]>`
      select ${effectiveStatus(sql)} as status, p.published_at, p.slug from blog.post p where p.id = ${postId}
    `;
    if (!existing) return { ok: false, error: "This post no longer exists." };
  }

  const now = Date.now();
  let effective: PostIntent = intent;
  if (intent === "update") {
    effective = existing?.status === "published" ? "publish" : existing?.status === "scheduled" ? "schedule" : "draft";
  }

  let status: PostStatus;
  let publishedAt = input.publishedAt;
  let scheduledAt = input.scheduledAt;

  if (effective === "publish") {
    if (publishedAt && publishedAt.getTime() > now + CLOCK_SKEW_MS) {
      return {
        ok: false,
        error: "The publish date is in the future.",
        fieldErrors: { publishedAt: "That date is in the future. Use Schedule to publish later." },
      };
    }
    status = "published";
    publishedAt = publishedAt ?? (existing?.status === "published" ? existing.published_at : null) ?? new Date(now);
    scheduledAt = null;
  } else if (effective === "schedule") {
    if (!scheduledAt) {
      return { ok: false, error: "Pick when the post should go live.", fieldErrors: { scheduledAt: "Pick a date and time." } };
    }
    if (scheduledAt.getTime() <= now) {
      return { ok: false, error: "The scheduled time has passed.", fieldErrors: { scheduledAt: "Pick a time in the future." } };
    }
    status = "scheduled";
    publishedAt = scheduledAt;
  } else {
    status = "draft";
    /* Unpublishing keeps the original date so republishing does not quietly
       re-date the post; a draft that was only scheduled has nothing to keep. */
    if (intent === "unpublish" && !publishedAt && existing?.status === "published") publishedAt = existing.published_at;
  }

  let slug = input.slug;
  if (!slug) {
    const base = slugify(input.title) || "post";
    const taken = await sql<{ slug: string }[]>`
      select slug from blog.post
      where (slug = ${base} or slug like ${slugFamilyPattern(base)})
        and id <> ${postId ?? "0"}
    `;
    slug = nextFreeSlug(base, taken.map((row) => row.slug));
  }

  const content = sanitizeContent(input.content);
  const tagIds = sql.array(input.tagIds);

  try {
    /* The post and its tags in one statement, which is atomic on its own —
       no BEGIN/COMMIT round trips. Tags the post keeps are left alone, new
       ones are added, dropped ones removed; selecting from blog.tag skips any
       id that does not exist. */
    const [row] = postId
      ? await sql<{ id: string }[]>`
          with saved as (
            update blog.post set
              title = ${input.title},
              slug = ${slug},
              excerpt = ${input.excerpt},
              content = ${content},
              featured_image = ${input.featuredImage},
              og_image = ${input.ogImage},
              twitter_card = ${input.twitterCard},
              author_id = ${input.authorId},
              category_id = ${input.categoryId},
              status = ${status},
              published_at = ${publishedAt},
              scheduled_at = ${scheduledAt},
              seo_title = ${input.seoTitle},
              seo_description = ${input.seoDescription},
              seo_keywords = ${input.seoKeywords},
              canonical_url = ${input.canonicalUrl},
              updated_by = ${adminId},
              updated_at = now()
            where id = ${postId}
            returning id
          ),
          dropped as (
            delete from blog.post_tag
            where post_id in (select id from saved) and not (tag_id = any(${tagIds}::bigint[]))
          ),
          added as (
            insert into blog.post_tag (post_id, tag_id)
            select saved.id, t.id from saved join blog.tag t on t.id = any(${tagIds}::bigint[])
            on conflict do nothing
          )
          select id from saved
        `
      : await sql<{ id: string }[]>`
          with saved as (
            insert into blog.post (
              title, slug, excerpt, content, featured_image, og_image, twitter_card,
              author_id, category_id, status, published_at, scheduled_at,
              seo_title, seo_description, seo_keywords, canonical_url, created_by, updated_by
            ) values (
              ${input.title}, ${slug}, ${input.excerpt}, ${content}, ${input.featuredImage},
              ${input.ogImage}, ${input.twitterCard}, ${input.authorId}, ${input.categoryId},
              ${status}, ${publishedAt}, ${scheduledAt}, ${input.seoTitle}, ${input.seoDescription},
              ${input.seoKeywords}, ${input.canonicalUrl}, ${adminId}, ${adminId}
            )
            returning id
          ),
          added as (
            insert into blog.post_tag (post_id, tag_id)
            select saved.id, t.id from saved join blog.tag t on t.id = any(${tagIds}::bigint[])
          )
          select id from saved
        `;

    if (!row) return { ok: false, error: "This post no longer exists." };
    return { ok: true, id: row.id, slug, status, previousSlug: existing?.slug ?? null };
  } catch (err) {
    if (uniqueViolation(err) === "post_slug_key") {
      return {
        ok: false,
        error: "Another post already uses this slug.",
        fieldErrors: { slug: "Another post already uses this slug." },
      };
    }
    const code = (err as { code?: string }).code;
    const constraint = (err as { constraint_name?: string }).constraint_name;
    if (code === "23503" && constraint === "post_author_id_fkey") {
      return { ok: false, error: "That author no longer exists.", fieldErrors: { authorId: "Pick another author." } };
    }
    if (code === "23503" && constraint === "post_category_id_fkey") {
      return { ok: false, error: "That category no longer exists.", fieldErrors: { categoryId: "Pick another category." } };
    }
    throw err;
  }
}

/** A draft copy with its tags. Returns the new id. */
export async function duplicatePost(adminId: string, id: string): Promise<string | null> {
  const sql = requireSql();
  const [source] = await sql<{ title: string; slug: string; taken: string[] }[]>`
    select p.title, p.slug,
           array(
             select o.slug from blog.post o
             where left(o.slug, length(p.slug) + 5) = p.slug || '-copy'
           ) as taken
    from blog.post p
    where p.id = ${id}
  `;
  if (!source) return null;

  const slug = nextFreeSlug(`${source.slug}-copy`.slice(0, 110), source.taken);
  const title = `Copy of ${source.title}`.slice(0, 200);

  const [copy] = await sql<{ id: string }[]>`
    with copy as (
      insert into blog.post (
        title, slug, excerpt, content, featured_image, og_image, twitter_card,
        author_id, category_id, status, seo_title, seo_description, seo_keywords,
        canonical_url, created_by, updated_by
      )
      select ${title}, ${slug}, excerpt, content, featured_image, og_image, twitter_card,
             author_id, category_id, 'draft', seo_title, seo_description, seo_keywords,
             null, ${adminId}, ${adminId}
      from blog.post where id = ${id}
      returning id
    ),
    tags as (
      insert into blog.post_tag (post_id, tag_id)
      select copy.id, pt.tag_id from copy, blog.post_tag pt where pt.post_id = ${id}
    )
    select id from copy
  `;
  return copy?.id ?? null;
}

export async function deletePost(id: string): Promise<{ slug: string } | null> {
  const sql = requireSql();
  const [row] = await sql<{ slug: string }[]>`delete from blog.post where id = ${id} returning slug`;
  return row ?? null;
}

/** Publishes from the posts table, keeping an earlier publish date if it has one. */
export async function setPostPublished(adminId: string, id: string, published: boolean) {
  const sql = requireSql();
  const [row] = published
    ? await sql<{ slug: string; status: PostStatus }[]>`
        update blog.post set
          status = 'published',
          published_at = case when published_at is not null and published_at <= now() then published_at else now() end,
          scheduled_at = null,
          updated_by = ${adminId},
          updated_at = now()
        where id = ${id}
        returning slug, status
      `
    : await sql<{ slug: string; status: PostStatus }[]>`
        update blog.post set
          status = 'draft',
          published_at = case when status = 'scheduled' and published_at > now() then null else published_at end,
          scheduled_at = null,
          updated_by = ${adminId},
          updated_at = now()
        where id = ${id}
        returning slug, status
      `;
  return row ?? null;
}
