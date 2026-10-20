"use server";

import { adminAction, noteActivity, quoted } from "@/lib/blog/action-guard";
import { revalidateBlog } from "@/lib/blog/revalidate";
import {
  deleteAuthor,
  deleteCategory,
  deleteTag,
  saveAuthor,
  saveCategory,
  saveTag,
} from "@/lib/blog/taxonomy";
import type { ActionResult, Option } from "@/lib/blog/types";
import { authorSchema, categorySchema, fieldErrors, idSchema, tagSchema } from "@/lib/blog/validation";

const nullableId = idSchema.nullable();
const INVALID = "Some fields need attention.";
const EDIT_CATEGORIES = ["blog.categories", "edit"] as const;
/* The post editor can add a tag on the spot. */
const ADD_TAGS = [["blog.tags", "edit"], ["blog.posts", "edit"]] as const;
const EDIT_TAGS = ["blog.tags", "edit"] as const;
const EDIT_AUTHORS = ["blog.authors", "edit"] as const;

export async function saveCategoryAction(id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("save category", EDIT_CATEGORIES, async (admin) => {
    const target = nullableId.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    const parsed = categorySchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: INVALID, fieldErrors: fieldErrors(parsed.error) };

    const result = await saveCategory(target.data, parsed.data);
    if (!result.ok) return result;
    await noteActivity(admin, `${target.data ? "Edited" : "Added"} the category ${quoted(parsed.data.name)}`);
    revalidateBlog();
    return { ok: true, data: { id: result.id }, message: target.data ? "Category updated." : "Category added." };
  });
}

export async function deleteCategoryAction(id: unknown): Promise<ActionResult> {
  return adminAction("delete category", EDIT_CATEGORIES, async (admin) => {
    const target = idSchema.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    if (!(await deleteCategory(target.data))) return { ok: false, error: "That category no longer exists." };
    await noteActivity(admin, `Deleted category #${target.data}`);
    revalidateBlog();
    return { ok: true, data: undefined, message: "Category deleted." };
  });
}

export async function saveTagAction(id: unknown, values: unknown): Promise<ActionResult<Option>> {
  return adminAction("save tag", id === null ? ADD_TAGS : EDIT_TAGS, async (admin) => {
    const target = nullableId.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    const parsed = tagSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: INVALID, fieldErrors: fieldErrors(parsed.error) };

    const result = await saveTag(target.data, parsed.data);
    if (!result.ok) return result;
    await noteActivity(admin, `${target.data ? "Edited" : "Added"} the tag ${quoted(parsed.data.name)}`);
    revalidateBlog();
    return {
      ok: true,
      data: { id: result.id, name: parsed.data.name },
      message: target.data ? "Tag updated." : "Tag added.",
    };
  });
}

export async function deleteTagAction(id: unknown): Promise<ActionResult> {
  return adminAction("delete tag", EDIT_TAGS, async (admin) => {
    const target = idSchema.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    if (!(await deleteTag(target.data))) return { ok: false, error: "That tag no longer exists." };
    await noteActivity(admin, `Deleted tag #${target.data}`);
    revalidateBlog();
    return { ok: true, data: undefined, message: "Tag deleted." };
  });
}

export async function saveAuthorAction(id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("save author", EDIT_AUTHORS, async (admin) => {
    const target = nullableId.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    const parsed = authorSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: INVALID, fieldErrors: fieldErrors(parsed.error) };

    const result = await saveAuthor(target.data, parsed.data);
    if (!result.ok) return result;
    await noteActivity(admin, `${target.data ? "Edited" : "Added"} the author ${quoted(parsed.data.name)}`);
    revalidateBlog();
    return { ok: true, data: { id: result.id }, message: target.data ? "Author updated." : "Author added." };
  });
}

export async function deleteAuthorAction(id: unknown): Promise<ActionResult> {
  return adminAction("delete author", EDIT_AUTHORS, async (admin) => {
    const target = idSchema.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    if (!(await deleteAuthor(target.data))) return { ok: false, error: "That author no longer exists." };
    await noteActivity(admin, `Deleted author #${target.data}`);
    revalidateBlog();
    return { ok: true, data: undefined, message: "Author deleted." };
  });
}
