import "server-only";

import { sanitizeContent } from "./sanitize";
import { requireSql } from "./sql";
import type { ArticleData } from "./types";
import type { PostInput } from "./validation";

/**
 * Editor previews. The Preview button renders exactly what is on screen —
 * including unsaved edits to a live post — without saving over it, by
 * snapshotting the editor state into `blog.post_preview` and rendering the
 * snapshot through the real article template at an admin-only URL.
 */

export async function createPreview(adminId: string, postId: string | null, input: PostInput): Promise<string> {
  const sql = requireSql();

  /* Byline, category and tag names in one trip. */
  const [names] = await sql<
    {
      author: { name: string; slug: string; bio: string | null; avatar_url: string | null } | null;
      category: { name: string; slug: string } | null;
      tags: { name: string; slug: string }[];
    }[]
  >`
    select
      (select row_to_json(a) from (
        select name, slug, bio, avatar_url from blog.author where id = ${input.authorId}
      ) a) as author,
      (select row_to_json(c) from (
        select name, slug from blog.category where id = ${input.categoryId}
      ) c) as category,
      coalesce((
        select json_agg(json_build_object('name', name, 'slug', slug) order by lower(name))
        from blog.tag where id = any(${sql.array(input.tagIds)}::bigint[])
      ), '[]') as tags
  `;
  const { author, category, tags } = names;

  const now = new Date().toISOString();
  const data: ArticleData = {
    id: postId,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    contentHtml: sanitizeContent(input.content),
    featuredImage: input.featuredImage,
    ogImage: input.ogImage,
    twitterCard: input.twitterCard,
    publishedAt: (input.publishedAt ?? input.scheduledAt)?.toISOString() ?? now,
    updatedAt: now,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    seoKeywords: input.seoKeywords,
    canonicalUrl: input.canonicalUrl,
    author: author ? { name: author.name, slug: author.slug, bio: author.bio, avatarUrl: author.avatar_url } : null,
    category,
    tags,
  };

  /* Sweeping old snapshots rides along with writing the new one. */
  const [row] = await sql<{ id: string }[]>`
    with sweep as (
      delete from blog.post_preview where created_at < now() - interval '1 day'
    )
    insert into blog.post_preview (post_id, data, created_by)
    values (${postId}, ${sql.json(data)}, ${adminId})
    returning id
  `;
  return row.id;
}

export async function getPreview(id: string): Promise<ArticleData | null> {
  const sql = requireSql();
  const [row] = await sql<{ data: ArticleData }[]>`
    select data from blog.post_preview
    where id = ${id} and created_at > now() - interval '1 day'
  `;
  if (!row) return null;
  /* Sanitised when stored; again here so a hand-edited row cannot inject. */
  return { ...row.data, contentHtml: sanitizeContent(row.data.contentHtml) };
}
