"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { adminAction, noteActivity, quoted } from "@/lib/blog/action-guard";
import { deleteMedia, listMedia, MediaError, mediaUsage, storeUpload, updateMediaAlt } from "@/lib/blog/media";
import type { ActionResult, MediaItem } from "@/lib/blog/types";

const mediaId = z.uuid();

/* The image pickers in the post editor and the author editor list and upload
   too, so editing posts or authors is enough for those two; the Media tab
   itself is for managing the library. */
const PICK_MEDIA = [
  ["blog.media", "view"],
  ["blog.posts", "edit"],
  ["blog.authors", "edit"],
] as const;
const ADD_MEDIA = [
  ["blog.media", "edit"],
  ["blog.posts", "edit"],
  ["blog.authors", "edit"],
] as const;
const EDIT_MEDIA = ["blog.media", "edit"] as const;

/**
 * One file per call, so a failure costs one image and the progress is honest.
 * No refresh() here: the editor's picker uploads too, and re-rendering the
 * whole edit page once per file would be wasted work. The library page
 * refreshes once after a batch instead.
 */
export async function uploadMediaAction(formData: FormData): Promise<ActionResult<MediaItem>> {
  return adminAction("upload media", ADD_MEDIA, async (admin) => {
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Choose an image to upload." };
    try {
      const item = await storeUpload(file, admin.id);
      await noteActivity(admin, `Uploaded the image ${quoted(file.name)}`);
      return { ok: true, data: item, message: "Image uploaded." };
    } catch (err) {
      if (err instanceof MediaError) return { ok: false, error: err.message };
      throw err;
    }
  });
}

export async function listMediaAction(
  q: unknown,
  page: unknown,
): Promise<ActionResult<{ items: MediaItem[]; page: number; pageCount: number }>> {
  return adminAction("list media", PICK_MEDIA, async () => {
    const search = typeof q === "string" ? q.trim().slice(0, 100) : "";
    const current = typeof page === "number" && Number.isInteger(page) && page > 0 ? page : 1;
    const result = await listMedia(search, current, 24);
    return { ok: true, data: { items: result.items, page: result.page, pageCount: result.pageCount } };
  });
}

export async function updateMediaAltAction(id: unknown, altText: unknown): Promise<ActionResult> {
  return adminAction("update media", EDIT_MEDIA, async (admin) => {
    const target = mediaId.safeParse(id);
    if (!target.success || typeof altText !== "string") return { ok: false, error: "Invalid request." };
    const alt = altText.trim().slice(0, 300) || null;
    if (!(await updateMediaAlt(target.data, alt))) return { ok: false, error: "That image no longer exists." };
    await noteActivity(admin, "Changed an image's alt text");
    refresh();
    return { ok: true, data: undefined, message: "Alt text saved." };
  });
}

/**
 * Deleting an image a post still shows would leave a hole in that post, so
 * the first call reports how many places use it; the UI confirms and calls
 * again with `force`.
 */
export async function deleteMediaAction(id: unknown, force: unknown): Promise<ActionResult<{ inUse: number }>> {
  return adminAction("delete media", EDIT_MEDIA, async (admin) => {
    const target = mediaId.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };

    if (force !== true) {
      const inUse = await mediaUsage(target.data);
      if (inUse > 0) return { ok: true, data: { inUse } };
    }
    if (!(await deleteMedia(target.data))) return { ok: false, error: "That image no longer exists." };
    await noteActivity(admin, "Deleted an image from the media library");
    refresh();
    return { ok: true, data: { inUse: 0 }, message: "Image deleted." };
  });
}
