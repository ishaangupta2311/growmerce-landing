/**
 * Gives an admin account a byline if it has none.
 *
 * Shared by the first-login bootstrap and `scripts/create-admin.ts`, so it
 * stays free of `server-only` and takes the client as an argument.
 */

import type { Sql } from "postgres";
import { nextFreeSlug, slugFamilyPattern, slugify } from "./slug";

export async function ensureAuthorProfile(sql: Sql, adminId: string, name: string): Promise<void> {
  const [existing] = await sql`select id from blog.author where admin_user_id = ${adminId}`;
  if (existing) return;

  const base = slugify(name) || "author";
  const taken = await sql<{ slug: string }[]>`
    select slug from blog.author where slug = ${base} or slug like ${slugFamilyPattern(base)}
  `;
  await sql`
    insert into blog.author (name, slug, admin_user_id)
    values (${name}, ${nextFreeSlug(base, taken.map((row) => row.slug))}, ${adminId})
    on conflict do nothing
  `;
}
