import type { Metadata } from "next";
import TaxonomyManager from "@/components/admin/TaxonomyManager";
import { requireAccess } from "@/lib/admin/session";
import { listTags } from "@/lib/blog/taxonomy";
import { allows } from "@/lib/team/permissions";

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage({ searchParams }: PageProps<"/admin/blog/tags">) {
  const admin = await requireAccess("blog.tags");
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 100);
  const rows = await listTags(query);
  return <TaxonomyManager kind="tag" rows={rows} query={query} canEdit={allows(admin.grant, "blog.tags", "edit")} />;
}
