import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogArticle from "@/components/blog/BlogArticle";
import { requireAdmin } from "@/lib/auth/session";
import { getPreview } from "@/lib/blog/previews";

export const metadata: Metadata = { title: "Preview" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** What the editor held when Preview was pressed, saved or not. Links last a day. */
export default async function EditorPreview({ params }: PageProps<"/admin/preview/[token]">) {
  const { token } = await params;
  if (!UUID.test(token)) notFound();

  const [, article] = await Promise.all([requireAdmin(), getPreview(token)]);
  if (!article) notFound();

  return (
    <BlogArticle
      article={article}
      preview={{
        label: "Showing the editor’s current content, including unsaved changes.",
        backHref: article.id ? `/admin/blogs/${article.id}/edit` : "/admin/blogs/new",
      }}
    />
  );
}
