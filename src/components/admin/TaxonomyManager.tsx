"use client";

import { useState, useTransition } from "react";
import { FolderOpen, LoaderCircle, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import {
  deleteCategoryAction,
  deleteTagAction,
  saveCategoryAction,
  saveTagAction,
} from "@/app/admin/_actions/taxonomy";
import { slugify } from "@/lib/blog/slug";
import type { ActionResult } from "@/lib/blog/types";
import { ConfirmDialog, Modal, useToast } from "./overlay";
import UrlSearch from "./UrlSearch";
import { Button, EmptyState, Field, Input, Textarea } from "./ui";

type Row = { id: string; name: string; slug: string; description?: string | null; postCount: number };
type Draft = { id: string | null; name: string; slug: string; description: string };

const COPY = {
  category: {
    singular: "category",
    plural: "categories",
    icon: FolderOpen,
    orphan: (n: number) => `${n} ${n === 1 ? "post" : "posts"} will become uncategorized.`,
  },
  tag: {
    singular: "tag",
    plural: "tags",
    icon: Tags,
    orphan: (n: number) => `It will be removed from ${n} ${n === 1 ? "post" : "posts"}.`,
  },
} as const;

/** The categories page and the tags page: search, add, edit, delete. */
export default function TaxonomyManager({ kind, rows, query }: { kind: "category" | "tag"; rows: Row[]; query: string }) {
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const copy = COPY[kind];
  const Icon = copy.icon;
  const withDescription = kind === "category";

  function edit(row: Row | null) {
    setErrors({});
    setSlugTouched(Boolean(row));
    setDraft(row ? { id: row.id, name: row.name, slug: row.slug, description: row.description ?? "" } : { id: null, name: "", slug: "", description: "" });
  }

  function submit() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setErrors({ name: "Enter a name." });
      return;
    }
    startTransition(async () => {
      const values = { name: draft.name, slug: draft.slug, description: draft.description };
      const result: ActionResult<unknown> =
        kind === "category" ? await saveCategoryAction(draft.id, values) : await saveTagAction(draft.id, values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? { form: result.error });
        return;
      }
      notify(result.message ?? "Saved.");
      setDraft(null);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = kind === "category" ? await deleteCategoryAction(deleting.id) : await deleteTagAction(deleting.id);
      if (!result.ok) notify(result.error, "error");
      else notify(result.message ?? "Deleted.");
      setDeleting(null);
    });
  }

  const title = copy.plural[0].toUpperCase() + copy.plural.slice(1);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {rows.length} {rows.length === 1 ? copy.singular : copy.plural}
            {query ? ` matching “${query}”` : ""}
          </p>
        </div>
        <Button variant="primary" onClick={() => edit(null)}>
          <Plus className="size-4" />
          Add {copy.singular}
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="border-b border-zinc-100 p-3 sm:p-4">
          <UrlSearch placeholder={`Search ${copy.plural}…`} className="sm:max-w-sm" />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Icon className="size-5" />}
            title={query ? `No ${copy.plural} match` : `No ${copy.plural} yet`}
            action={
              !query && (
                <Button variant="primary" size="sm" onClick={() => edit(null)}>
                  <Plus className="size-4" />
                  Add {copy.singular}
                </Button>
              )
            }
          >
            {query ? "Try a different search." : `Group posts by ${copy.singular} to help readers find related writing.`}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                <tr>
                  <th scope="col" className="py-2.5 pl-4 sm:pl-5">Name</th>
                  <th scope="col" className="px-3 py-2.5">Slug</th>
                  {withDescription && <th scope="col" className="px-3 py-2.5">Description</th>}
                  <th scope="col" className="px-3 py-2.5 text-right">Blogs</th>
                  <th scope="col" className="py-2.5 pr-4 text-right sm:pr-5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/60">
                    <td className="py-3 pl-4 font-semibold text-zinc-900 sm:pl-5">{row.name}</td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-500">{row.slug}</td>
                    {withDescription && (
                      <td className="max-w-xs px-3 py-3 text-zinc-600">
                        <span className="line-clamp-2">{row.description || <span className="text-zinc-400">—</span>}</span>
                      </td>
                    )}
                    <td className="px-3 py-3 text-right text-zinc-700 tabular-nums">{row.postCount}</td>
                    <td className="py-3 pr-3 sm:pr-4">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="icon" onClick={() => edit(row)} aria-label={`Edit ${row.name}`} title="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(row)}
                          aria-label={`Delete ${row.name}`}
                          title="Delete"
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={draft !== null}
        onClose={() => !pending && setDraft(null)}
        title={draft?.id ? `Edit ${copy.singular}` : `Add ${copy.singular}`}
        footer={
          <>
            <Button onClick={() => setDraft(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={pending}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {draft?.id ? "Save changes" : `Add ${copy.singular}`}
            </Button>
          </>
        }
      >
        {draft && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {errors.form && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.form}</p>}
            <Field label="Name" htmlFor="tax-name" error={errors.name}>
              <Input
                id="tax-name"
                autoFocus
                value={draft.name}
                maxLength={kind === "category" ? 80 : 60}
                aria-invalid={Boolean(errors.name) || undefined}
                onChange={(event) => {
                  const name = event.target.value;
                  setDraft({ ...draft, name, slug: slugTouched ? draft.slug : slugify(name) });
                }}
              />
            </Field>
            <Field label="Slug" htmlFor="tax-slug" error={errors.slug} hint="Lowercase letters, numbers and hyphens. Leave empty to generate.">
              <Input
                id="tax-slug"
                value={draft.slug}
                maxLength={120}
                spellCheck={false}
                aria-invalid={Boolean(errors.slug) || undefined}
                onChange={(event) => {
                  setSlugTouched(true);
                  setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") });
                }}
              />
            </Field>
            {withDescription && (
              <Field label="Description" htmlFor="tax-description" error={errors.description} hint="Optional. Up to 500 characters.">
                <Textarea
                  id="tax-description"
                  rows={3}
                  maxLength={500}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </Field>
            )}
            <button type="submit" hidden />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        pending={pending}
        title={`Delete this ${copy.singular}?`}
      >
        {deleting && (
          <>
            <strong className="text-zinc-900">{deleting.name}</strong> will be deleted.{" "}
            {deleting.postCount > 0 && copy.orphan(deleting.postCount)} This cannot be undone.
          </>
        )}
      </ConfirmDialog>
    </>
  );
}
