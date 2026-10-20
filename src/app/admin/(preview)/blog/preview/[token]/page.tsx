import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogArticle from "@/components/blog/BlogArticle";
import { requireAccess } from "@/lib/admin/session";
import { getPreview } from "@/lib/blog/previews";
import { allows } from "@/lib/team/permissions";

export const metadata: Metadata = { title: "Preview" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** What the editor held when Preview was pressed, saved or not. Links last a day. */
export default async function EditorPreview({ params }: PageProps<"/admin/blog/preview/[token]">) {
  const admin = await requireAccess("blog.posts");
  const { token } = await params;
  if (!UUID.test(token)) notFound();

  const article = await getPreview(token);
  if (!article) notFound();
  /* A preview of a post never saved goes back to a new post, which only a role with edit can open. */
  const fallback = allows(admin.grant, "blog.posts", "edit") ? "/admin/blog/new" : "/admin/blog";

  return (
    <BlogArticle
      article={article}
      preview={{
        label: "Showing the editor’s current content, including unsaved changes.",
        backHref: article.id ? `/admin/blog/${article.id}/edit` : fallback,
      }}
    />
  );
}
