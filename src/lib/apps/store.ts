import "server-only";

import { cache } from "react";

import { requireSql, uniqueViolation } from "@/lib/blog/sql";
import type { AppRow, Platform } from "./types";

/**
 * Your apps, the database side: the app list in `apps.app` and the starred
 * stores in `apps.starred_store` (migrations/0011_apps.sql). Callers have
 * already passed `requireAdmin()` and validated their input.
 */

type AppRecord = {
  id: string;
  name: string;
  platforms: Platform[];
  base_url: string;
  secret_env: string;
  icon_url: string | null;
};

function toApp(row: AppRecord): AppRow {
  return {
    id: row.id,
    name: row.name,
    platforms: row.platforms,
    baseUrl: row.base_url,
    secretEnv: row.secret_env,
    iconUrl: row.icon_url,
  };
}

export async function listApps(): Promise<AppRow[]> {
  const sql = requireSql();
  const rows = await sql<AppRecord[]>`
    select id, name, platforms, base_url, secret_env, icon_url
    from apps.app
    order by position, created_at
  `;
  return rows.map(toApp);
}

/** One app, read once per request however many parts of a page ask. */
export const getApp = cache(async (id: string): Promise<AppRow | null> => {
  const sql = requireSql();
  const [row] = await sql<AppRecord[]>`
    select id, name, platforms, base_url, secret_env, icon_url
    from apps.app
    where id = ${id}
  `;
  return row ? toApp(row) : null;
});

export type AppValues = Omit<AppRow, "id">;

type SaveResult = { ok: true; id: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Adds a new app under `id`, or updates the app `id` names when `existing` is set. */
export async function saveApp(id: string, values: AppValues, existing: boolean): Promise<SaveResult> {
  const sql = requireSql();
  if (existing) {
    const updated = await sql`
      update apps.app
         set name = ${values.name},
             platforms = ${values.platforms},
             base_url = ${values.baseUrl},
             secret_env = ${values.secretEnv},
             icon_url = ${values.iconUrl},
             updated_at = now()
       where id = ${id}
    `;
    return updated.count ? { ok: true, id } : { ok: false, error: "That app no longer exists." };
  }

  try {
    await sql`
      insert into apps.app (id, name, platforms, base_url, secret_env, icon_url, position)
      values (
        ${id}, ${values.name}, ${values.platforms}, ${values.baseUrl}, ${values.secretEnv}, ${values.iconUrl},
        (select coalesce(max(position), -1) + 1 from apps.app)
      )
    `;
    return { ok: true, id };
  } catch (err) {
    if (uniqueViolation(err) !== null) {
      const error = "An app with that address already exists.";
      return { ok: false, error, fieldErrors: { id: error } };
    }
    throw err;
  }
}

export async function deleteApp(id: string): Promise<boolean> {
  const sql = requireSql();
  const deleted = await sql`delete from apps.app where id = ${id}`;
  return deleted.count > 0;
}

export async function starredStores(appId: string): Promise<Set<string>> {
  const sql = requireSql();
  const rows = await sql<{ store_id: string }[]>`
    select store_id from apps.starred_store where app_id = ${appId}
  `;
  return new Set(rows.map((row) => row.store_id));
}

/** How many stores are starred in each app, for the app cards. */
export async function starCounts(): Promise<Map<string, number>> {
  const sql = requireSql();
  const rows = await sql<{ app_id: string; count: number }[]>`
    select app_id, count(*)::int as count from apps.starred_store group by app_id
  `;
  return new Map(rows.map((row) => [row.app_id, row.count]));
}

export async function setStarred(appId: string, storeId: string, starred: boolean, by: string): Promise<void> {
  const sql = requireSql();
  if (starred) {
    await sql`
      insert into apps.starred_store (app_id, store_id, starred_by)
      values (${appId}, ${storeId}, ${by})
      on conflict (app_id, store_id) do nothing
    `;
  } else {
    await sql`delete from apps.starred_store where app_id = ${appId} and store_id = ${storeId}`;
  }
}
