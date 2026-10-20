import TeamTabs from "@/components/admin/team/TeamTabs";
import { PageHeader } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";

/** The Team tab's header and its three pages. Each page checks access again. */
export default async function TeamLayout({ children }: LayoutProps<"/admin/team">) {
  await requireAccess("team");
  return (
    <>
      <PageHeader title="Team" description="Who can sign in to the admin, and what each person can see and change." />
      <TeamTabs />
      {children}
    </>
  );
}
