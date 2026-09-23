import "server-only";

import { unstable_rethrow } from "next/navigation";
import { requireAdmin, type Admin } from "@/lib/admin/session";
import { DatabaseUnavailableError } from "./sql";
import type { ActionResult } from "./types";

/**
 * The frame every admin Server Action runs in.
 *
 * 1. The session is checked first, against the database, on every call —
 *    an action is a public POST endpoint whether or not a button renders it.
 *    No session means a redirect to the login page.
 * 2. Anything the work throws becomes `{ ok: false }` with a message fit for
 *    the UI; the details go to the log (message only — postgres.js errors
 *    carry their query parameters).
 */
export async function adminAction<T>(
  label: string,
  work: (admin: Admin) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const admin = await requireAdmin();
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
