import "server-only";

import { nextFreeSlug, slugFamilyPattern, slugify } from "./slug";
import { requireSql, uniqueViolation } from "./sql";
import type { AuthorRow, CategoryRow, Option, TagRow } from "./types";

/**
 * Categories, tags and authors — the admin side. Callers have already passed
 * `requireAdmin()` and validated their input.
 */

type Result = { ok: true; id: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, "\\$&")}%`;
}

/** The given slug, or one made from the name that no other row uses. */
async function resolveSlug(
  table: "category" | "tag" | "author",
  name: string,
  given: string,
  excludeId: string | null,
): Promise<string> {
  if (given) return given;
  const sql = requireSql();
  const base = slugify(name) || table;
  const taken = await sql<{ slug: string }[]>`
    select slug from ${sql(`blog.${table}`)}
    where (slug = ${base} or slug like ${slugFamilyPattern(base)}) and id <> ${excludeId ?? "0"}
  `;
  return nextFreeSlug(base, taken.map((row) => row.slug));
}

function slugTaken(err: unknown, constraint: string): Result | null {
  return uniqueViolation(err) === constraint
    ? { ok: false, error: "That slug is already in use.", fieldErrors: { slug: "That slug is already in use." } }
    : null;
}

/* ─── Categories ─────────────────────────────────────────────────────── */

export async function listCategories(q = ""): Promise<CategoryRow[]> {
  const sql = requireSql();
  const filter = q ? sql`where c.name ilike ${likePattern(q)} or c.slug ilike ${likePattern(q)}` : sql``;
  const rows = await sql<{ id: string; name: string; slug: string; description: string | null; post_count: number }[]>`
    select c.id, c.name, c.slug, c.description, count(p.id)::int as post_count
    from blog.category c
    left join blog.post p on p.category_id = c.id
    ${filter}
    group by c.id
    order by lower(c.name)
  `;
  return rows.map((row) => ({ ...row, postCount: row.post_count }));
}

export async function saveCategory(
  id: string | null,
  input: { name: string; slug: string; description: string | null },
): Promise<Result> {
  const sql = requireSql();
  const slug = await resolveSlug("category", input.name, input.slug, id);
  try {
    const [row] = id
      ? await sql<{ id: string }[]>`
          update blog.category
          set name = ${input.name}, slug = ${slug}, description = ${input.description}, updated_at = now()
          where id = ${id}
          returning id
        `
      : await sql<{ id: string }[]>`
          insert into blog.category (name, slug, description)
          values (${input.name}, ${slug}, ${input.description})
          returning id
        `;
    return row ? { ok: true, id: row.id } : { ok: false, error: "That category no longer exists." };
  } catch (err) {
    const taken = slugTaken(err, "category_slug_key");
    if (taken) return taken;
    throw err;
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`delete from blog.category where id = ${id} returning id`;
  return rows.length > 0;
}

/* ─── Tags ───────────────────────────────────────────────────────────── */

export async function listTags(q = ""): Promise<TagRow[]> {
  const sql = requireSql();
  const filter = q ? sql`where t.name ilike ${likePattern(q)} or t.slug ilike ${likePattern(q)}` : sql``;
  const rows = await sql<{ id: string; name: string; slug: string; post_count: number }[]>`
    select t.id, t.name, t.slug, count(pt.post_id)::int as post_count
    from blog.tag t
    left join blog.post_tag pt on pt.tag_id = t.id
    ${filter}
    group by t.id
    order by lower(t.name)
  `;
  return rows.map((row) => ({ ...row, postCount: row.post_count }));
}

export async function saveTag(id: string | null, input: { name: string; slug: string }): Promise<Result> {
  const sql = requireSql();
  const slug = await resolveSlug("tag", input.name, input.slug, id);
  try {
    const [row] = id
      ? await sql<{ id: string }[]>`
          update blog.tag set name = ${input.name}, slug = ${slug}, updated_at = now()
          where id = ${id}
          returning id
        `
      : await sql<{ id: string }[]>`
          insert into blog.tag (name, slug) values (${input.name}, ${slug})
          returning id
        `;
    return row ? { ok: true, id: row.id } : { ok: false, error: "That tag no longer exists." };
  } catch (err) {
    const taken = slugTaken(err, "tag_slug_key");
    if (taken) return taken;
    throw err;
  }
}

export async function deleteTag(id: string): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`delete from blog.tag where id = ${id} returning id`;
  return rows.length > 0;
}

/* ─── Authors ────────────────────────────────────────────────────────── */

export async function listAuthors(): Promise<AuthorRow[]> {
  const sql = requireSql();
  const rows = await sql<
    { id: string; name: string; slug: string; bio: string | null; avatar_url: string | null; post_count: number; admin_email: string | null }[]
  >`
    select a.id, a.name, a.slug, a.bio, a.avatar_url, u.email as admin_email,
           (select count(*)::int from blog.post p where p.author_id = a.id) as post_count
    from blog.author a
    left join blog.admin_user u on u.id = a.admin_user_id
    order by lower(a.name)
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    postCount: row.post_count,
    adminEmail: row.admin_email,
  }));
}

export async function saveAuthor(
  id: string | null,
  input: { name: string; slug: string; bio: string | null; avatarUrl: string | null },
): Promise<Result> {
  const sql = requireSql();
  const slug = await resolveSlug("author", input.name, input.slug, id);
  try {
    const [row] = id
      ? await sql<{ id: string }[]>`
          update blog.author
          set name = ${input.name}, slug = ${slug}, bio = ${input.bio}, avatar_url = ${input.avatarUrl}, updated_at = now()
          where id = ${id}
          returning id
        `
      : await sql<{ id: string }[]>`
          insert into blog.author (name, slug, bio, avatar_url)
          values (${input.name}, ${slug}, ${input.bio}, ${input.avatarUrl})
          returning id
        `;
    return row ? { ok: true, id: row.id } : { ok: false, error: "That author no longer exists." };
  } catch (err) {
    const taken = slugTaken(err, "author_slug_key");
    if (taken) return taken;
    throw err;
  }
}

export async function deleteAuthor(id: string): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`delete from blog.author where id = ${id} returning id`;
  return rows.length > 0;
}

/* ─── Options for the editor's pickers ───────────────────────────────── */

export async function editorOptions(): Promise<{ authors: Option[]; categories: Option[]; tags: Option[] }> {
  const sql = requireSql();
  /* One trip for all three lists; ids as text to match the rest of the app. */
  const [row] = await sql<{ authors: Option[]; categories: Option[]; tags: Option[] }[]>`
    select
      coalesce((select json_agg(json_build_object('id', id::text, 'name', name) order by lower(name)) from blog.author), '[]') as authors,
      coalesce((select json_agg(json_build_object('id', id::text, 'name', name) order by lower(name)) from blog.category), '[]') as categories,
      coalesce((select json_agg(json_build_object('id', id::text, 'name', name) order by lower(name)) from blog.tag), '[]') as tags
  `;
  return row;
}
