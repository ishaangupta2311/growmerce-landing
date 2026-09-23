import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogArticle from "@/components/blog/BlogArticle";
import { requireAdmin } from "@/lib/admin/session";
import { loadArticleById } from "@/lib/blog/public";
import { requireSql } from "@/lib/blog/sql";

export const metadata: Metadata = { title: "Preview" };

/** The saved version of any post — draft, scheduled or live — as readers would see it. */
export default async function SavedPostPreview({ params }: PageProps<"/admin/blog/[id]/preview">) {
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) notFound();

  const [, result] = await Promise.all([requireAdmin(), loadArticleById(requireSql(), id)]);
  if (!result) notFound();

  return (
    <BlogArticle
      article={result.article}
      preview={{ label: "Saved version. Not visible to readers unless published.", backHref: `/admin/blog/${id}/edit` }}
    />
  );
}
