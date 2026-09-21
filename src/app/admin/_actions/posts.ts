"use server";

import { z } from "zod";
import { adminAction } from "@/lib/blog/action-guard";
import {
  deletePost,
  duplicatePost,
  savePost,
  setPostPublished,
} from "@/lib/blog/posts";
import { createPreview } from "@/lib/blog/previews";
import { revalidateBlog } from "@/lib/blog/revalidate";
import { POST_INTENTS, type ActionResult, type PostStatus } from "@/lib/blog/types";
import { fieldErrors, idSchema, postSchema } from "@/lib/blog/validation";

/* Every argument arrives from the browser and is parsed as untrusted. */

const nullableId = idSchema.nullable();
const intentSchema = z.enum(POST_INTENTS);

const INVALID = "Some fields need attention.";

export async function savePostAction(
  postId: unknown,
  values: unknown,
  intent: unknown,
): Promise<ActionResult<{ id: string; slug: string; status: PostStatus }>> {
  return adminAction("save post", async (admin) => {
    const id = nullableId.safeParse(postId);
    const action = intentSchema.safeParse(intent);
    if (!id.success || !action.success) return { ok: false, error: "Invalid request." };

    const parsed = postSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: INVALID, fieldErrors: fieldErrors(parsed.error) };

    const outcome = await savePost(admin.id, id.data, parsed.data, action.data);
    if (!outcome.ok) return outcome;

    revalidateBlog();
    const message = {
      draft: "Draft saved.",
      update: "Changes saved.",
      publish: "Post published.",
      schedule: "Post scheduled.",
      unpublish: "Post unpublished.",
    }[action.data];
    return { ok: true, data: { id: outcome.id, slug: outcome.slug, status: outcome.status }, message };
  });
}

/** Snapshots the editor's current state and returns the preview URL. */
export async function previewPostAction(postId: unknown, values: unknown): Promise<ActionResult<{ url: string }>> {
  return adminAction("preview post", async (admin) => {
    const id = nullableId.safeParse(postId);
    if (!id.success) return { ok: false, error: "Invalid request." };

    /* A preview should work for a half-written post, so the two fields that
       cannot be empty on save get stand-ins here. */
    const draft = typeof values === "object" && values !== null ? (values as Record<string, unknown>) : {};
    const parsed = postSchema.safeParse({
      ...draft,
      title: typeof draft.title === "string" && draft.title.trim() ? draft.title : "Untitled post",
      slug: typeof draft.slug === "string" && postSchema.shape.slug.safeParse(draft.slug).success ? draft.slug : "",
    });
    if (!parsed.success) return { ok: false, error: INVALID, fieldErrors: fieldErrors(parsed.error) };

    const previewId = await createPreview(admin.id, id.data, parsed.data);
    return { ok: true, data: { url: `/admin/preview/${previewId}` } };
  });
}

export async function duplicatePostAction(postId: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("duplicate post", async (admin) => {
    const id = idSchema.safeParse(postId);
    if (!id.success) return { ok: false, error: "Invalid request." };
    const copy = await duplicatePost(admin.id, id.data);
    if (!copy) return { ok: false, error: "That post no longer exists." };
    return { ok: true, data: { id: copy }, message: "Post duplicated as a draft." };
  });
}

export async function deletePostAction(postId: unknown): Promise<ActionResult> {
  return adminAction("delete post", async () => {
    const id = idSchema.safeParse(postId);
    if (!id.success) return { ok: false, error: "Invalid request." };
    const deleted = await deletePost(id.data);
    if (!deleted) return { ok: false, error: "That post no longer exists." };
    revalidateBlog();
    return { ok: true, data: undefined, message: "Post deleted." };
  });
}

export async function setPublishedAction(postId: unknown, published: unknown): Promise<ActionResult> {
  return adminAction("publish post", async (admin) => {
    const id = idSchema.safeParse(postId);
    if (!id.success || typeof published !== "boolean") return { ok: false, error: "Invalid request." };
    const row = await setPostPublished(admin.id, id.data, published);
    if (!row) return { ok: false, error: "That post no longer exists." };
    revalidateBlog();
    return { ok: true, data: undefined, message: published ? "Post published." : "Post unpublished." };
  });
}
