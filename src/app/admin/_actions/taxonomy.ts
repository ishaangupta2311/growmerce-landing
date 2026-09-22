"use server";

import { adminAction } from "@/lib/blog/action-guard";
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

export async function saveCategoryAction(id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("save category", async () => {
    const target = nullableId.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    const parsed = categorySchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: INVALID, fieldErrors: fieldErrors(parsed.error) };

    const result = await saveCategory(target.data, parsed.data);
    if (!result.ok) return result;
    revalidateBlog();
    return { ok: true, data: { id: result.id }, message: target.data ? "Category updated." : "Category added." };
  });
}

export async function deleteCategoryAction(id: unknown): Promise<ActionResult> {
  return adminAction("delete category", async () => {
    const target = idSchema.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    if (!(await deleteCategory(target.data))) return { ok: false, error: "That category no longer exists." };
    revalidateBlog();
    return { ok: true, data: undefined, message: "Category deleted." };
  });
}

export async function saveTagAction(id: unknown, values: unknown): Promise<ActionResult<Option>> {
  return adminAction("save tag", async () => {
    const target = nullableId.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    const parsed = tagSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: INVALID, fieldErrors: fieldErrors(parsed.error) };

    const result = await saveTag(target.data, parsed.data);
    if (!result.ok) return result;
    revalidateBlog();
    return {
      ok: true,
      data: { id: result.id, name: parsed.data.name },
      message: target.data ? "Tag updated." : "Tag added.",
    };
  });
}

export async function deleteTagAction(id: unknown): Promise<ActionResult> {
  return adminAction("delete tag", async () => {
    const target = idSchema.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    if (!(await deleteTag(target.data))) return { ok: false, error: "That tag no longer exists." };
    revalidateBlog();
    return { ok: true, data: undefined, message: "Tag deleted." };
  });
}

export async function saveAuthorAction(id: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("save author", async () => {
    const target = nullableId.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    const parsed = authorSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: INVALID, fieldErrors: fieldErrors(parsed.error) };

    const result = await saveAuthor(target.data, parsed.data);
    if (!result.ok) return result;
    revalidateBlog();
    return { ok: true, data: { id: result.id }, message: target.data ? "Author updated." : "Author added." };
  });
}

export async function deleteAuthorAction(id: unknown): Promise<ActionResult> {
  return adminAction("delete author", async () => {
    const target = idSchema.safeParse(id);
    if (!target.success) return { ok: false, error: "Invalid request." };
    if (!(await deleteAuthor(target.data))) return { ok: false, error: "That author no longer exists." };
    revalidateBlog();
    return { ok: true, data: undefined, message: "Author deleted." };
  });
}
