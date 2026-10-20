import "server-only";

import { unstable_rethrow } from "next/navigation";
import { requireAdmin, type Admin } from "@/lib/admin/session";
import type { Sql } from "postgres";
import { allows, type Level } from "@/lib/team/permissions";
import { recordActivity } from "@/lib/team/store";
import { DatabaseUnavailableError } from "./sql";
import type { ActionResult } from "./types";

/**
 * A tab and the level needed on it. A list means any one of them will do;
 * null, that being on the team is enough (your own profile).
 */
export type Need = readonly [tab: string, level: Level] | readonly (readonly [tab: string, level: Level])[];

export const NO_ACCESS = "Your role doesn't allow that. Ask whoever manages the team.";

function meets(admin: Admin, need: Need): boolean {
  const options = typeof need[0] === "string" ? [need as readonly [string, Level]] : (need as readonly (readonly [string, Level])[]);
  return options.some(([tab, level]) => allows(admin.grant, tab, level));
}

/**
 * The frame every admin Server Action runs in.
 *
 * 1. The session is checked first, on every call — an action is a public POST
 *    endpoint whether or not a button renders it. No session means a redirect
 *    to the login page; not on the team, a 404.
 * 2. The role must reach `need`. The button for a refused action is hidden,
 *    so this is the answer to somebody calling it anyway.
 * 3. Anything the work throws becomes `{ ok: false }` with a message fit for
 *    the UI; the details go to the log (message only — postgres.js errors
 *    carry their query parameters).
 */
export async function adminAction<T>(
  label: string,
  need: Need | null,
  work: (admin: Admin) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const admin = await requireAdmin();
  if (need && !meets(admin, need)) return { ok: false, error: NO_ACCESS };
  try {
    return await work(admin);
  } catch (err) {
    unstable_rethrow(err);
    const why = err instanceof Error ? err.message : String(err);
    console.error(`[admin] ${label} failed — ${why.slice(0, 200)}`);
    return {
      ok: false,
      error: err instanceof DatabaseUnavailableError ? err.message : "Something went wrong. Please try again.",
    };
  }
}

/**
 * Adds a line to Team → Activity: "Published “Spring launch”". Never fails
 * the action that did the thing — the change has happened either way — so a
 * write that fails is logged instead.
 */
export async function noteActivity(admin: Pick<Admin, "email" | "name">, action: string, db?: Sql): Promise<void> {
  try {
    await recordActivity(admin, action, db);
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    console.error(`[admin] activity not recorded — ${why.slice(0, 200)}`);
  }
}

/** A name or title inside an activity line, quoted and kept short. */
export function quoted(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return `“${clean.length > 80 ? `${clean.slice(0, 79)}…` : clean}”`;
}
