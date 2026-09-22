import "server-only";

import type { Sql } from "postgres";
import { db, tryDb } from "@/lib/db";
import { htmlToText, sanitizeContent } from "./sanitize";
import type { ArticleCard, ArticleData, TwitterCard } from "./types";

/**
 * Reads for the public blog. Only live posts ever leave this file (except
 * through `loadArticleById`, which the admin-only preview route uses).
 *
 * "Live" is one rule, applied here and in the sitemap: published or
 * scheduled, and the publish moment has passed. A scheduled post therefore
 * goes live on time without a cron job — the next render after its moment
 * includes it, and the pages revalidate every minute.
 *
 * The listing and the sitemap follow the site's database rule (src/lib/db.ts):
 * a failure renders as "no posts" rather than an error, so a sleeping
 * database can never take the build or the site down. A single article
 * throws instead, because ISR keeps serving the last good copy when a
 * regeneration throws — better than caching a false 404.
 */

export const BLOG_PAGE_SIZE = 9;

const live = (sql: Sql) => sql`p.status in ('published', 'scheduled') and p.published_at <= now()`;

type CardRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  lead: string;
  featured_image: string | null;
  published_at: Date;
  author_name: string | null;
  category_name: string | null;
};

/** The post's own excerpt, or the opening of its text. */
export function fallbackExcerpt(excerpt: string | null, html: string, length = 180): string | null {
  if (excerpt) return excerpt;
  const text = htmlToText(html);
  if (!text) return null;
  if (text.length <= length) return text;
  return `${text.slice(0, length).replace(/\s+\S*$/, "")}…`;
}

function toCard(row: CardRow): ArticleCard {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: fallbackExcerpt(row.excerpt, row.lead),
    featuredImage: row.featured_image,
    publishedAt: row.published_at.toISOString(),
    authorName: row.author_name,
    categoryName: row.category_name,
  };
}

/* `left(content, 3000)` is plenty of text for a fallback excerpt without
   dragging whole articles through the connection for a listing. */
const cardColumns = (sql: Sql) => sql`
  p.id, p.title, p.slug, p.excerpt, left(p.content, 3000) as lead, p.featured_image,
  p.published_at, a.name as author_name, c.name as category_name
`;

export async function listLivePosts(page: number) {
  const empty = { items: [] as ArticleCard[], total: 0, page: 1, pageCount: 1 };
  return tryDb(
    "blog list",
    async (sql) => {
      /* Rows and total in one trip via a window count. */
      const rows = await sql<(CardRow & { total: number })[]>`
        select ${cardColumns(sql)}, count(*) over ()::int as total
        from blog.post p
        left join blog.author a on a.id = p.author_id
        left join blog.category c on c.id = p.category_id
        where ${live(sql)}
        order by p.published_at desc, p.id desc
        limit ${BLOG_PAGE_SIZE} offset ${(page - 1) * BLOG_PAGE_SIZE}
      `;
      let total = rows[0]?.total ?? 0;
      /* An empty page past the end still needs the real total, so the caller
         can tell "no such page" from "no posts". */
      if (rows.length === 0 && page > 1) {
        [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from blog.post p where ${live(sql)}`;
      }
      const pageCount = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
      return { items: rows.map(toCard), total, page, pageCount };
    },
    empty,
  );
}

export async function relatedPosts(postId: string, categoryId: string | null, limit = 3): Promise<ArticleCard[]> {
  return tryDb(
    "blog related",
    async (sql) => {
      const rows = await sql<CardRow[]>`
        select ${cardColumns(sql)}
        from blog.post p
        left join blog.author a on a.id = p.author_id
        left join blog.category c on c.id = p.category_id
        where ${live(sql)} and p.id <> ${postId}
        order by (p.category_id is not distinct from ${categoryId}) desc, p.published_at desc
        limit ${limit}
      `;
      return rows.map(toCard);
    },
    [],
  );
}

export async function sitemapPosts(): Promise<{ slug: string; lastModified: Date }[]> {
  return tryDb(
    "blog sitemap",
    async (sql) => {
      const rows = await sql<{ slug: string; updated_at: Date; published_at: Date }[]>`
        select p.slug, p.updated_at, p.published_at
        from blog.post p
        where ${live(sql)}
        order by p.published_at desc
      `;
      /* A scheduled post's updated_at predates its going live. */
      return rows.map((row) => ({
        slug: row.slug,
        lastModified: row.updated_at > row.published_at ? row.updated_at : row.published_at,
      }));
    },
    [],
  );
}

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  og_image: string | null;
  twitter_card: TwitterCard;
  published_at: Date | null;
  updated_at: Date;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  canonical_url: string | null;
  category_id: string | null;
  author_name: string | null;
  author_slug: string | null;
  author_bio: string | null;
  author_avatar: string | null;
  category_name: string | null;
  category_slug: string | null;
};

async function loadArticle(sql: Sql, where: ReturnType<Sql>) {
  const [row] = await sql<(ArticleRow & { tags: { name: string; slug: string }[] })[]>`
    select p.id, p.title, p.slug, p.excerpt, p.content, p.featured_image, p.og_image,
           p.twitter_card, p.published_at, p.updated_at, p.seo_title, p.seo_description,
           p.seo_keywords, p.canonical_url, p.category_id,
           a.name as author_name, a.slug as author_slug, a.bio as author_bio, a.avatar_url as author_avatar,
           c.name as category_name, c.slug as category_slug,
           coalesce((
             select json_agg(json_build_object('name', t.name, 'slug', t.slug) order by lower(t.name))
             from blog.post_tag pt
             join blog.tag t on t.id = pt.tag_id
             where pt.post_id = p.id
           ), '[]') as tags
    from blog.post p
    left join blog.author a on a.id = p.author_id
    left join blog.category c on c.id = p.category_id
    where ${where}
  `;
  if (!row) return null;
  const tags = row.tags;

  const article: ArticleData = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    contentHtml: sanitizeContent(row.content),
    featuredImage: row.featured_image,
    ogImage: row.og_image,
    twitterCard: row.twitter_card,
    publishedAt: row.published_at?.toISOString() ?? null,
    updatedAt: row.updated_at.toISOString(),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoKeywords: row.seo_keywords,
    canonicalUrl: row.canonical_url,
    author: row.author_name
      ? { name: row.author_name, slug: row.author_slug ?? "", bio: row.author_bio, avatarUrl: row.author_avatar }
      : null,
    category: row.category_name ? { name: row.category_name, slug: row.category_slug ?? "" } : null,
    tags: [...tags],
  };
  return { article, categoryId: row.category_id };
}

/** A live post by slug, or null. Throws when the database does. */
export async function getLivePost(slug: string) {
  const sql = db();
  if (!sql) return null;
  return loadArticle(sql, sql`p.slug = ${slug} and ${live(sql)}`);
}

/**
 * Any post by id, live or not. Only for the admin preview route, which has
 * already checked the session.
 */
export async function loadArticleById(sql: Sql, id: string) {
  return loadArticle(sql, sql`p.id = ${id}`);
}
