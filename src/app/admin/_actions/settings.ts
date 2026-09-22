"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/lib/blog/action-guard";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { destroyOtherSessions } from "@/lib/auth/session";
import { requireSql } from "@/lib/blog/sql";
import type { ActionResult } from "@/lib/blog/types";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100, "Keep it under 100 characters."),
});

export async function updateProfileAction(values: unknown): Promise<ActionResult> {
  return adminAction("update profile", async (admin) => {
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message, fieldErrors: { name: parsed.error.issues[0].message } };
    }
    const sql = requireSql();
    await sql`update blog.admin_user set name = ${parsed.data.name}, updated_at = now() where id = ${admin.id}`;
    /* The header shows the name; send the re-rendered page with the reply. */
    refresh();
    return { ok: true, data: undefined, message: "Profile saved." };
  });
}

/**
 * Requires the current password, so a session left open on a shared machine
 * cannot be used to lock the owner out. A successful change signs out every
 * other session: a password change is usually a response to a suspected leak.
 */
export async function changePasswordAction(values: unknown): Promise<ActionResult> {
  return adminAction("change password", async (admin): Promise<ActionResult> => {
    const input = (typeof values === "object" && values !== null ? values : {}) as Record<string, unknown>;
    const current = typeof input.current === "string" ? input.current : "";
    const next = typeof input.next === "string" ? input.next : "";
    const confirm = typeof input.confirm === "string" ? input.confirm : "";

    if (!current) return { ok: false, error: "Enter your current password.", fieldErrors: { current: "Required." } };
    const problem = passwordProblem(next);
    if (problem) return { ok: false, error: problem, fieldErrors: { next: problem } };
    if (next !== confirm) {
      return { ok: false, error: "The new passwords do not match.", fieldErrors: { confirm: "Does not match." } };
    }
    if (current.length > 256) return { ok: false, error: "Current password is incorrect.", fieldErrors: { current: "Incorrect." } };

    const sql = requireSql();
    const [user] = await sql<{ password_hash: string }[]>`select password_hash from blog.admin_user where id = ${admin.id}`;
    if (!user || !(await verifyPassword(current, user.password_hash))) {
      return { ok: false, error: "Current password is incorrect.", fieldErrors: { current: "Incorrect." } };
    }

    await sql`
      update blog.admin_user set password_hash = ${await hashPassword(next)}, updated_at = now()
      where id = ${admin.id}
    `;
    const signedOut = await destroyOtherSessions(admin.id, admin.sessionId);
    return {
      ok: true,
      data: undefined,
      message: signedOut > 0 ? `Password changed. Signed out ${signedOut} other session${signedOut === 1 ? "" : "s"}.` : "Password changed.",
    };
  });
}

export async function signOutOtherSessionsAction(): Promise<ActionResult<{ count: number }>> {
  return adminAction("sign out other sessions", async (admin) => {
    const count = await destroyOtherSessions(admin.id, admin.sessionId);
    return {
      ok: true,
      data: { count },
      message: count > 0 ? `Signed out ${count} other session${count === 1 ? "" : "s"}.` : "No other sessions were signed in.",
    };
  });
}
