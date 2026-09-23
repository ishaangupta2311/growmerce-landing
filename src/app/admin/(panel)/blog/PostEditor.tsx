"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarClock,
  Eye,
  EyeOff,
  LoaderCircle,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { deletePostAction, previewPostAction, savePostAction } from "@/app/admin/_actions/posts";
import { saveTagAction } from "@/app/admin/_actions/taxonomy";
import ImageField from "@/components/admin/ImageField";
import { ConfirmDialog, LocalTime, useIsClient, useToast } from "@/components/admin/overlay";
import RichTextEditor from "@/components/admin/RichTextEditor";
import TagPicker from "@/components/admin/TagPicker";
import { Button, Card, Field, Input, Select, StatusBadge, Textarea } from "@/components/admin/ui";
import { slugify } from "@/lib/blog/slug";
import type { Option, PostFormValues, PostIntent, PostStatus } from "@/lib/blog/types";

type Props = {
  post: (PostFormValues & { id: string; status: PostStatus; createdAt: string; updatedAt: string }) | null;
  defaults: PostFormValues;
  options: { authors: Option[]; categories: Option[]; tags: Option[] };
};

/** ISO → the value a datetime-local input wants, in the viewer's timezone. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** A datetime-local value (local time, no zone) → ISO. */
function fromLocalInput(value: string): string {
  return value ? new Date(value).toISOString() : "";
}

export default function PostEditor({ post, defaults, options }: Props) {
  const router = useRouter();
  const notify = useToast();
  const isClient = useIsClient();

  const [values, setValues] = useState<PostFormValues>(post ?? defaults);
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [tags, setTags] = useState<Option[]>(options.tags);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<PostIntent | "preview" | "delete" | null>(null);
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const content = useRef(values.content);

  const postId = post?.id ?? null;
  const busy = pending !== null;

  function set<K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    setDirty(true);
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  /* Leaving with unsaved edits asks first. */
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const payload = (): PostFormValues => ({ ...values, content: content.current });

  async function save(intent: PostIntent) {
    if (intent === "schedule" && !values.scheduledAt) {
      setErrors((e) => ({ ...e, scheduledAt: "Pick when this post should go live." }));
      document.getElementById("scheduledAt")?.focus();
      notify("Choose a scheduled date first.", "error");
      return;
    }

    setPending(intent);
    try {
      const result = await savePostAction(postId, payload(), intent);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        notify(result.error, "error");
        return;
      }
      setErrors({});
      setDirty(false);
      setStatus(result.data.status);
      setValues((current) => ({ ...current, slug: result.data.slug }));
      setSlugTouched(true);
      notify(result.message ?? "Saved.");
      /* An existing post needs nothing more: saving revalidates, so the
         re-rendered page (and a remounted editor, keyed on updatedAt) comes
         back with the action's response. */
      if (!postId) router.replace(`/admin/blog/${result.data.id}/edit`);
    } catch {
      notify("Could not reach the server. Your changes are still here — try again.", "error");
    } finally {
      setPending(null);
    }
  }

  async function preview() {
    /* Opened synchronously, inside the click, so popup blockers allow it. */
    const tab = window.open("", "_blank");
    setPending("preview");
    try {
      const result = await previewPostAction(postId, payload());
      if (!result.ok) {
        tab?.close();
        setErrors(result.fieldErrors ?? {});
        notify(result.error, "error");
        return;
      }
      if (tab) tab.location.href = result.data.url;
      else window.location.href = result.data.url;
    } catch {
      tab?.close();
      notify("Could not build the preview. Try again.", "error");
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    if (!postId) return;
    setPending("delete");
    const result = await deletePostAction(postId);
    setPending(null);
    if (!result.ok) {
      notify(result.error, "error");
      return;
    }
    setDirty(false);
    setConfirmDelete(false);
    notify(result.message ?? "Post deleted.");
    router.push("/admin/blog");
  }

  async function createTag(name: string): Promise<Option | null> {
    const result = await saveTagAction(null, { name, slug: "" });
    if (!result.ok) {
      notify(result.fieldErrors?.slug ?? result.error, "error");
      return null;
    }
    setTags((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)));
    return result.data;
  }

  /* Cmd/Ctrl+S saves without changing status. */
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current(status === "draft" ? "draft" : "update");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  const spinner = (intent: typeof pending) => pending === intent && <LoaderCircle className="size-4 animate-spin" />;

  const actions: ReactNode = (
    <>
      <Button onClick={preview} disabled={busy}>
        {spinner("preview") || <Eye className="size-4" />}
        Preview
      </Button>
      {status === "draft" && (
        <>
          <Button onClick={() => save("draft")} disabled={busy}>
            {spinner("draft") || <Save className="size-4" />}
            Save draft
          </Button>
          <Button onClick={() => save("schedule")} disabled={busy}>
            {spinner("schedule") || <CalendarClock className="size-4" />}
            Schedule
          </Button>
          <Button variant="primary" onClick={() => save("publish")} disabled={busy}>
            {spinner("publish") || <Send className="size-4" />}
            Publish
          </Button>
        </>
      )}
      {status === "scheduled" && (
        <>
          <Button onClick={() => save("draft")} disabled={busy}>
            {spinner("draft") || <Undo2 className="size-4" />}
            Revert to draft
          </Button>
          <Button onClick={() => save("update")} disabled={busy}>
            {spinner("update") || <Save className="size-4" />}
            Update
          </Button>
          <Button variant="primary" onClick={() => save("publish")} disabled={busy}>
            {spinner("publish") || <Send className="size-4" />}
            Publish now
          </Button>
        </>
      )}
      {status === "published" && (
        <>
          <Button onClick={() => save("unpublish")} disabled={busy}>
            {spinner("unpublish") || <EyeOff className="size-4" />}
            Unpublish
          </Button>
          <Button variant="primary" onClick={() => save("update")} disabled={busy}>
            {spinner("update") || <Save className="size-4" />}
            Update
          </Button>
        </>
      )}
    </>
  );

  const seoTitle = values.seoTitle || values.title || "Post title";
  const seoDescription = values.seoDescription || values.excerpt || "Add an excerpt or SEO description to control this snippet.";

  return (
    <>
      {/* Sticky from tablet up; on a phone the buttons wrap to two rows, so the
          bar scrolls away and the same actions repeat at the foot of the form. */}
      <div className="z-10 -mx-4 mb-6 border-b border-zinc-200 bg-zinc-50/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:sticky md:top-16 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-lg font-extrabold tracking-tight text-zinc-900">{postId ? "Edit post" : "New post"}</h1>
            <StatusBadge status={status} />
            {dirty && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Card>
            <div className="space-y-4">
              <Field label="Title" htmlFor="title" error={errors.title}>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(event) => set("title", event.target.value)}
                  placeholder="A clear, specific title"
                  aria-invalid={Boolean(errors.title) || undefined}
                  className="h-11 text-lg font-bold"
                  maxLength={200}
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="slug"
                error={errors.slug}
                hint={values.slug ? `growmerce.ai/blog/${values.slug}` : "Leave empty to create one from the title."}
              >
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center rounded-lg border border-zinc-200 bg-zinc-50 shadow-xs focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
                    <span className="pl-3 text-sm text-zinc-400 select-none">/blog/</span>
                    <input
                      id="slug"
                      value={values.slug}
                      onChange={(event) => {
                        setSlugTouched(true);
                        set("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"));
                      }}
                      aria-invalid={Boolean(errors.slug) || undefined}
                      className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
                      spellCheck={false}
                      maxLength={120}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setSlugTouched(false);
                      set("slug", slugify(values.title));
                    }}
                    aria-label="Regenerate slug from title"
                    title="Regenerate from title"
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </div>
              </Field>

              <Field
                label="Excerpt"
                htmlFor="excerpt"
                error={errors.excerpt}
                counter={{ value: values.excerpt.length, recommended: 160 }}
                hint="Shown on the blog listing and used as the description when no SEO description is set."
              >
                <Textarea
                  id="excerpt"
                  rows={3}
                  value={values.excerpt}
                  onChange={(event) => set("excerpt", event.target.value)}
                  aria-invalid={Boolean(errors.excerpt) || undefined}
                  maxLength={500}
                />
              </Field>
            </div>
          </Card>

          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-zinc-700">Content</p>
            <RichTextEditor
              initialHtml={values.content}
              invalid={Boolean(errors.content)}
              onChange={(html) => {
                content.current = html;
                if (!dirty) setDirty(true);
              }}
            />
            {errors.content && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.content}</p>}
          </div>

          <Card title="SEO" description="How this post appears in search results and when shared.">
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Search preview</p>
                <p className="mt-2 truncate text-xs text-zinc-600">growmerce.ai › blog › {values.slug || "…"}</p>
                <p className="mt-0.5 line-clamp-1 text-lg text-[#1a0dab]">{seoTitle}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">{seoDescription}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="SEO title"
                  htmlFor="seoTitle"
                  error={errors.seoTitle}
                  counter={{ value: values.seoTitle.length, recommended: 60 }}
                  hint="Defaults to the post title."
                >
                  <Input id="seoTitle" value={values.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} maxLength={120} />
                </Field>
                <Field label="Canonical URL" htmlFor="canonicalUrl" error={errors.canonicalUrl} hint="Only if this post was first published elsewhere.">
                  <Input
                    id="canonicalUrl"
                    type="url"
                    value={values.canonicalUrl}
                    onChange={(event) => set("canonicalUrl", event.target.value)}
                    placeholder="https://"
                    aria-invalid={Boolean(errors.canonicalUrl) || undefined}
                  />
                </Field>
              </div>

              <Field
                label="SEO description"
                htmlFor="seoDescription"
                error={errors.seoDescription}
                counter={{ value: values.seoDescription.length, recommended: 160 }}
                hint="Defaults to the excerpt."
              >
                <Textarea
                  id="seoDescription"
                  rows={2}
                  value={values.seoDescription}
                  onChange={(event) => set("seoDescription", event.target.value)}
                  maxLength={320}
                />
              </Field>

              <Field label="SEO keywords" htmlFor="seoKeywords" error={errors.seoKeywords} hint="Comma-separated.">
                <Input
                  id="seoKeywords"
                  value={values.seoKeywords}
                  onChange={(event) => set("seoKeywords", event.target.value)}
                  placeholder="ecommerce search, shopify"
                  maxLength={500}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <ImageField
                  id="ogImage"
                  label="Open Graph image"
                  value={values.ogImage}
                  onChange={(value) => set("ogImage", value)}
                  error={errors.ogImage}
                  hint="1200×630 works best. Defaults to the featured image."
                />
                <Field label="Twitter card" htmlFor="twitterCard" hint="How the link unfurls on X.">
                  <Select
                    id="twitterCard"
                    value={values.twitterCard}
                    onChange={(event) => set("twitterCard", event.target.value as PostFormValues["twitterCard"])}
                  >
                    <option value="summary_large_image">Large image</option>
                    <option value="summary">Small summary</option>
                  </Select>
                </Field>
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card title="Publishing">
            <div className="space-y-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-zinc-500">Status</dt>
                <dd className="text-right">
                  <StatusBadge status={status} />
                </dd>
                {post && (
                  <>
                    <dt className="text-zinc-500">Created</dt>
                    <dd className="text-right text-zinc-700">
                      <LocalTime iso={post.createdAt} mode="date" />
                    </dd>
                    <dt className="text-zinc-500">Updated</dt>
                    <dd className="text-right text-zinc-700">
                      <LocalTime iso={post.updatedAt} />
                    </dd>
                  </>
                )}
              </dl>

              <Field
                label="Publish date"
                htmlFor="publishedAt"
                error={errors.publishedAt}
                hint="Leave empty to use the moment you publish. Set a past date to backdate."
              >
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={isClient ? toLocalInput(values.publishedAt) : ""}
                  onChange={(event) => set("publishedAt", fromLocalInput(event.target.value))}
                  aria-invalid={Boolean(errors.publishedAt) || undefined}
                />
              </Field>

              <Field
                label="Scheduled date"
                htmlFor="scheduledAt"
                error={errors.scheduledAt}
                hint="Pick a future time, then press Schedule. The post goes live automatically."
              >
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={isClient ? toLocalInput(values.scheduledAt) : ""}
                  min={isClient ? toLocalInput(new Date().toISOString()) : undefined}
                  onChange={(event) => set("scheduledAt", fromLocalInput(event.target.value))}
                  aria-invalid={Boolean(errors.scheduledAt) || undefined}
                />
              </Field>

              {status === "scheduled" && values.scheduledAt && (
                <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">
                  Goes live <LocalTime iso={values.scheduledAt} />.
                </p>
              )}

              {postId && (
                <div className="border-t border-zinc-100 pt-3">
                  <Button variant="dangerGhost" size="sm" onClick={() => setConfirmDelete(true)} disabled={busy} className="-ml-2">
                    <Trash2 className="size-4" />
                    Delete post
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card title="Organization">
            <div className="space-y-4">
              <Field label="Author" htmlFor="authorId" error={errors.authorId}>
                <Select id="authorId" value={values.authorId} onChange={(event) => set("authorId", event.target.value)}>
                  <option value="">No author</option>
                  {options.authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Category" htmlFor="categoryId" error={errors.categoryId}>
                <Select id="categoryId" value={values.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
                  <option value="">Uncategorized</option>
                  {options.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tags" htmlFor="tags" error={errors.tagIds} hint="Type to search, Enter to create.">
                <TagPicker
                  id="tags"
                  options={tags}
                  value={values.tagIds}
                  onChange={(ids) => set("tagIds", ids)}
                  onCreate={createTag}
                />
              </Field>
            </div>
          </Card>

          <Card title="Featured image">
            <ImageField
              id="featuredImage"
              label="Featured image"
              value={values.featuredImage}
              onChange={(value) => set("featuredImage", value)}
              error={errors.featuredImage}
              hint="Shown at the top of the post and on the blog listing."
            />
          </Card>
        </aside>
      </div>

      {/* Actions again at the foot on small screens, where the sidebar sits
          below a long post. */}
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-zinc-200 pt-4 lg:hidden">{actions}</div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        pending={pending === "delete"}
        title="Delete this post?"
      >
        <strong className="text-zinc-900">“{values.title || "Untitled"}”</strong> will be permanently deleted
        {status === "published" ? " and removed from the blog and sitemap" : ""}. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}
