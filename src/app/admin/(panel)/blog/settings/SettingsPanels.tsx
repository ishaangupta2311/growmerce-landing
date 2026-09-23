"use client";

import { useState, useTransition } from "react";
import { KeyRound, LoaderCircle, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import { updateProfileAction } from "@/app/admin/_actions/settings";
import { deleteAuthorAction, saveAuthorAction } from "@/app/admin/_actions/taxonomy";
import ImageField from "@/components/admin/ImageField";
import { ConfirmDialog, Modal, useToast } from "@/components/admin/overlay";
import Thumb from "@/components/admin/Thumb";
import { Button, ButtonLink, Card, EmptyState, Field, Input, Textarea } from "@/components/admin/ui";
import { slugify } from "@/lib/blog/slug";
import type { AuthorRow } from "@/lib/blog/types";

export function ProfileCard({ name, email }: { name: string; email: string }) {
  const notify = useToast();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <Card title="Your account" description="How you appear in the admin panel.">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await updateProfileAction({ name: value });
            if (!result.ok) {
              setError(result.fieldErrors?.name ?? result.error);
              return;
            }
            setError(undefined);
            notify(result.message ?? "Saved.");
          });
        }}
      >
        <Field label="Name" htmlFor="profile-name" error={error}>
          <Input id="profile-name" value={value} maxLength={100} onChange={(event) => setValue(event.target.value)} />
        </Field>
        <Field label="Email" htmlFor="profile-email" hint="Your sign-in address, and the one the admin allowlist names.">
          <Input id="profile-email" value={email} disabled readOnly />
        </Field>
        <Button type="submit" variant="primary" disabled={pending || value.trim() === name}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          Save
        </Button>
      </form>
    </Card>
  );
}

/**
 * Where the password went.
 *
 * Admins sign in with the same Supabase account the affiliate program uses,
 * so there is no admin password to change here any more — and a form that
 * looked like it changed one would be changing nothing. What is left is to say
 * where it lives now.
 */
export function SignInCard() {
  return (
    <Card title="Signing in" description="One account for the whole admin: blog and affiliates.">
      <p className="text-sm leading-relaxed text-zinc-600">
        You sign in with your Growmerce account — the same login the affiliate program uses. Access to the
        admin comes from the server&rsquo;s allowlist, not from anything on this page. To change your password,
        use &ldquo;Forgot password&rdquo; on the sign-in page.
      </p>
      <ButtonLink href="/affiliates/forgot" className="mt-4">
        <KeyRound className="size-4" />
        Reset password
      </ButtonLink>
    </Card>
  );
}

type AuthorDraft = { id: string | null; name: string; slug: string; bio: string; avatarUrl: string };

export function AuthorsCard({ authors }: { authors: AuthorRow[] }) {
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<AuthorDraft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<AuthorRow | null>(null);

  function edit(author: AuthorRow | null) {
    setErrors({});
    setSlugTouched(Boolean(author));
    setDraft(
      author
        ? { id: author.id, name: author.name, slug: author.slug, bio: author.bio ?? "", avatarUrl: author.avatarUrl ?? "" }
        : { id: null, name: "", slug: "", bio: "", avatarUrl: "" },
    );
  }

  function submit() {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveAuthorAction(draft.id, {
        name: draft.name,
        slug: draft.slug,
        bio: draft.bio,
        avatarUrl: draft.avatarUrl,
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? { form: result.error });
        return;
      }
      notify(result.message ?? "Saved.");
      setDraft(null);
    });
  }

  return (
    <Card
      title="Authors"
      description="Bylines you can pick when writing. Guest authors do not need an account."
      bodyClassName="p-0"
      actions={
        <Button size="sm" variant="primary" onClick={() => edit(null)}>
          <Plus className="size-4" />
          Add author
        </Button>
      }
    >
      {authors.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title="No authors yet">
          Add one so posts can carry a byline.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {authors.map((author) => (
            <li key={author.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              {author.avatarUrl ? (
                <Thumb src={author.avatarUrl} className="size-10 shrink-0 rounded-full" sizes="40px" />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-400">
                  <UserRound className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{author.name}</p>
                <p className="truncate text-xs text-zinc-500">
                  {author.postCount} {author.postCount === 1 ? "post" : "posts"}
                  {author.adminEmail ? ` · linked to ${author.adminEmail}` : " · guest author"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => edit(author)} aria-label={`Edit ${author.name}`}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleting(author)}
                aria-label={`Delete ${author.name}`}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={draft !== null}
        onClose={() => !pending && setDraft(null)}
        title={draft?.id ? "Edit author" : "Add author"}
        footer={
          <>
            <Button onClick={() => setDraft(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={pending}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              Save
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
            <Field label="Name" htmlFor="author-name" error={errors.name}>
              <Input
                id="author-name"
                autoFocus
                value={draft.name}
                maxLength={100}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value, slug: slugTouched ? draft.slug : slugify(event.target.value) })
                }
              />
            </Field>
            <Field label="Slug" htmlFor="author-slug" error={errors.slug}>
              <Input
                id="author-slug"
                value={draft.slug}
                maxLength={120}
                onChange={(event) => {
                  setSlugTouched(true);
                  setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") });
                }}
              />
            </Field>
            <Field label="Bio" htmlFor="author-bio" error={errors.bio} hint="Shown under posts by this author.">
              <Textarea id="author-bio" rows={3} maxLength={1000} value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} />
            </Field>
            <ImageField
              id="author-avatar"
              label="Photo"
              value={draft.avatarUrl}
              onChange={(value) => setDraft({ ...draft, avatarUrl: value })}
              error={errors.avatarUrl}
              aspect="aspect-square max-w-40"
            />
            <button type="submit" hidden />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        pending={pending}
        title="Delete this author?"
        onConfirm={() =>
          startTransition(async () => {
            if (!deleting) return;
            const result = await deleteAuthorAction(deleting.id);
            notify(result.ok ? (result.message ?? "Deleted.") : result.error, result.ok ? "success" : "error");
            setDeleting(null);
          })
        }
      >
        {deleting && (
          <>
            <strong className="text-zinc-900">{deleting.name}</strong> will be deleted.
            {deleting.postCount > 0 && ` Their ${deleting.postCount} ${deleting.postCount === 1 ? "post keeps" : "posts keep"} publishing without a byline.`}{" "}
            This cannot be undone.
          </>
        )}
      </ConfirmDialog>
    </Card>
  );
}
