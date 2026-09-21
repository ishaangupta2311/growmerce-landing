import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { listAuthors } from "@/lib/blog/taxonomy";
import { AuthorsCard, PasswordCard, ProfileCard, SessionsCard } from "./SettingsPanels";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [admin, authors] = await Promise.all([requireAdmin(), listAuthors()]);

  return (
    <>
      <PageHeader title="Settings" description="Your account, security and the authors who write for the blog." />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ProfileCard name={admin.name} email={admin.email} />
          <PasswordCard />
          <SessionsCard />
        </div>
        <AuthorsCard authors={authors} />
      </div>
    </>
  );
}
