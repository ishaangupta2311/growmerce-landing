import type { Metadata } from "next";
import TaxonomyManager from "@/components/admin/TaxonomyManager";
import { requireAdmin } from "@/lib/auth/session";
import { listTags } from "@/lib/blog/taxonomy";

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage({ searchParams }: PageProps<"/admin/tags">) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 100);
  const [, rows] = await Promise.all([requireAdmin(), listTags(query)]);
  return <TaxonomyManager kind="tag" rows={rows} query={query} />;
}
