"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { slugify } from "@/lib/blog/slug";
import { adminAction } from "@/lib/blog/action-guard";
import type { ActionResult } from "@/lib/blog/types";
import { fieldErrors } from "@/lib/blog/validation";
import { deleteApp, getApp, saveApp, setStarred } from "@/lib/apps/store";
import { appIdSchema, appSchema } from "@/lib/apps/validation";

/**
 * What the admin does in Your apps: add, change and remove an app, and star
 * the stores worth watching. Every action checks the admin first (see
 * `adminAction`); none of them reaches into an app.
 */

const storeIdSchema = z.string().min(1).max(300);

export async function saveAppAction(existingId: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("save app", async () => {
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
    revalidatePath("/admin/apps", "layout");
    return { ok: true, data: { id }, message: existing ? "App updated." : "App added." };
  });
}

export async function deleteAppAction(id: unknown): Promise<ActionResult> {
  return adminAction("delete app", async () => {
    const target = appIdSchema.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    if (!(await deleteApp(target.data))) return { ok: false, error: "That app no longer exists." };
    revalidatePath("/admin/apps", "layout");
    return { ok: true, data: undefined, message: "App removed." };
  });
}

export async function setStarredAction(appId: unknown, storeId: unknown, starred: unknown): Promise<ActionResult> {
  return adminAction("star store", async (admin) => {
    const app = appIdSchema.safeParse(appId);
    const store = storeIdSchema.safeParse(storeId);
    if (!app.success || !store.success || typeof starred !== "boolean") {
      return { ok: false, error: "Invalid request." };
    }
    if (!(await getApp(app.data))) return { ok: false, error: "That app no longer exists." };

    await setStarred(app.data, store.data, starred, admin.email);
    /* No revalidatePath: the button has already moved the star, and these
       pages render fresh on every visit. Revalidating would re-render this
       one, which asks the app for its whole store list again. */
    return { ok: true, data: undefined };
  });
}
