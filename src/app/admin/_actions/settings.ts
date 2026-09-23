"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/lib/blog/action-guard";
import { requireSql } from "@/lib/blog/sql";
import type { ActionResult } from "@/lib/blog/types";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100, "Keep it under 100 characters."),
});

/*
 * The password and "sign out other devices" actions that used to sit here are
 * gone with the blog's own login. Admins sign in through Supabase now, so a
 * password is changed from the sign-in page's reset link, and a session is
 * Supabase's to end.
 */
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
