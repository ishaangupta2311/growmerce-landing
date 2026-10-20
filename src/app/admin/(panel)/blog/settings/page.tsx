import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";
import { listAuthors } from "@/lib/blog/taxonomy";
import { AuthorsCard } from "./SettingsPanels";

export const metadata: Metadata = { title: "Authors" };

export default async function SettingsPage() {
  await requireAccess("blog.authors");
  const authors = await listAuthors();

  return (
    <>
      <PageHeader title="Authors" description="The bylines on blog posts. Your own name and password are under My account." />
      <div className="max-w-3xl">
        <AuthorsCard authors={authors} />
      </div>
    </>
  );
}
