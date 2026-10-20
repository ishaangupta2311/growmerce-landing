import type { Metadata } from "next";
import TaxonomyManager from "@/components/admin/TaxonomyManager";
import { requireAccess } from "@/lib/admin/session";
import { listCategories } from "@/lib/blog/taxonomy";
import { allows } from "@/lib/team/permissions";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/blog/categories">) {
  const admin = await requireAccess("blog.categories");
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 100);
  const rows = await listCategories(query);
  return <TaxonomyManager kind="category" rows={rows} query={query} canEdit={allows(admin.grant, "blog.categories", "edit")} />;
}
