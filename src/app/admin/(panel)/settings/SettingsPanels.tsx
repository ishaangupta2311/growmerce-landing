"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle, LogOut, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import {
  changePasswordAction,
  signOutOtherSessionsAction,
  updateProfileAction,
} from "@/app/admin/_actions/settings";
import { deleteAuthorAction, saveAuthorAction } from "@/app/admin/_actions/taxonomy";
import ImageField from "@/components/admin/ImageField";
import { ConfirmDialog, Modal, useToast } from "@/components/admin/overlay";
import Thumb from "@/components/admin/Thumb";
import { Button, Card, EmptyState, Field, Input, Textarea } from "@/components/admin/ui";
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
        <Field label="Email" htmlFor="profile-email" hint="Your sign-in address. Change it with `npm run admin:create`.">
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

export function PasswordCard() {
  const notify = useToast();
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();

  const field = (key: keyof typeof values, label: string, hint?: string, autoComplete = "new-password") => (
    <Field label={label} htmlFor={`pw-${key}`} error={errors[key]} hint={hint}>
      <Input
        id={`pw-${key}`}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={values[key]}
        aria-invalid={Boolean(errors[key]) || undefined}
        onChange={(event) => setValues({ ...values, [key]: event.target.value })}
      />
    </Field>
  );

  return (
    <Card
      title="Password"
      description="Changing it signs you out on every other device."
      actions={
        <Button variant="ghost" size="sm" onClick={() => setShow((s) => !s)} aria-pressed={show}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {show ? "Hide" : "Show"}
        </Button>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await changePasswordAction(values);
            if (!result.ok) {
              setErrors(result.fieldErrors ?? {});
              notify(result.error, "error");
              return;
            }
            setErrors({});
            setValues({ current: "", next: "", confirm: "" });
            notify(result.message ?? "Password changed.");
          });
        }}
      >
        {field("current", "Current password", undefined, "current-password")}
        {field("next", "New password", "At least 12 characters.")}
        {field("confirm", "Confirm new password")}
        <Button type="submit" variant="primary" disabled={pending || !values.current || !values.next}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Change password
        </Button>
      </form>
    </Card>
  );
}

export function SessionsCard() {
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Card title="Sessions" description="Sessions last 7 days. Logging out ends this one immediately.">
      <p className="text-sm text-zinc-600">
        Signed in on a shared or lost device? End every session except this one.
      </p>
      <Button
        className="mt-4"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await signOutOtherSessionsAction();
            notify(result.ok ? (result.message ?? "Done.") : result.error, result.ok ? "success" : "error");
          })
        }
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
        Sign out other sessions
      </Button>
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
