import type { Metadata } from "next";
import TaxonomyManager from "@/components/admin/TaxonomyManager";
import { requireAdmin } from "@/lib/auth/session";
import { listCategories } from "@/lib/blog/taxonomy";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 100);
  const [, rows] = await Promise.all([requireAdmin(), listCategories(query)]);
  return <TaxonomyManager kind="category" rows={rows} query={query} />;
}
