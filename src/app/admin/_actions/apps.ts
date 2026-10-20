"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { slugify } from "@/lib/blog/slug";
import { adminAction, noteActivity, quoted } from "@/lib/blog/action-guard";
import type { ActionResult } from "@/lib/blog/types";
import { fieldErrors } from "@/lib/blog/validation";
import { deleteApp, getApp, saveApp, setStarred } from "@/lib/apps/store";
import { appIdSchema, appSchema } from "@/lib/apps/validation";
import { APP_SETTINGS, appKey } from "@/lib/team/permissions";

/**
 * What the admin does in Your apps: add, change and remove an app, and star
 * the stores worth watching. Every action checks the admin and their role
 * first (see `adminAction`); none of them reaches into an app.
 */

const storeIdSchema = z.string().min(1).max(300);

export async function saveAppAction(existingId: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("save app", [APP_SETTINGS, "edit"], async (admin) => {
    const existing = existingId === null ? null : appIdSchema.safeParse(existingId);
    if (existing && !existing.success) return { ok: false, error: "Invalid request." };

    const parsed = appSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: "Some fields need attention.", fieldErrors: fieldErrors(parsed.error) };
    }

    const id = existing ? existing.data : slugify(parsed.data.name).slice(0, 40).replace(/-+$/, "");
    if (!appIdSchema.safeParse(id).success) {
      const error = "Use a name with some letters or numbers in it.";
      return { ok: false, error, fieldErrors: { name: error } };
    }
    /* /admin/apps/new is the add-an-app page, so no app can live there. */
    if (!existing && id === "new") {
      const error = "Pick another name: this one is taken by the admin itself.";
      return { ok: false, error, fieldErrors: { name: error } };
    }

    const result = await saveApp(id, parsed.data, existing !== null);
    if (!result.ok) return result;
    await noteActivity(admin, `${existing ? "Changed the settings of" : "Added the app"} ${quoted(parsed.data.name)}`);
    revalidatePath("/admin/apps", "layout");
    return { ok: true, data: { id }, message: existing ? "App updated." : "App added." };
  });
}

export async function deleteAppAction(id: unknown): Promise<ActionResult> {
  return adminAction("delete app", [APP_SETTINGS, "edit"], async (admin) => {
    const target = appIdSchema.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    const app = await getApp(target.data);
    if (!app || !(await deleteApp(target.data))) return { ok: false, error: "That app no longer exists." };
    await noteActivity(admin, `Removed the app ${quoted(app.name)}`);
    revalidatePath("/admin/apps", "layout");
    return { ok: true, data: undefined, message: "App removed." };
  });
}

export async function setStarredAction(appId: unknown, storeId: unknown, starred: unknown): Promise<ActionResult> {
  return adminAction("star store", [appKey(String(appId)), "edit"], async (admin) => {
    const app = appIdSchema.safeParse(appId);
    const store = storeIdSchema.safeParse(storeId);
    if (!app.success || !store.success || typeof starred !== "boolean") {
      return { ok: false, error: "Invalid request." };
    }
    const row = await getApp(app.data);
    if (!row) return { ok: false, error: "That app no longer exists." };

    await setStarred(app.data, store.data, starred, admin.email);
    await noteActivity(admin, `${starred ? "Starred" : "Unstarred"} ${quoted(store.data.replace(/^[a-z]+:/, ""))} in ${row.name}`);
    /* No revalidatePath: the button has already moved the star, and these
       pages render fresh on every visit. Revalidating would re-render this
       one, which asks the app for its whole store list again. */
    return { ok: true, data: undefined };
  });
}
