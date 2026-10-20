import type { Metadata } from "next";

import RoleEditor from "@/components/admin/team/RoleEditor";
import { PageHeader } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";
import { listApps } from "@/lib/apps/store";
import { sections } from "@/lib/team/permissions";

export const metadata: Metadata = { title: "New role" };

export default async function NewRolePage() {
  const admin = await requireAccess("team", "edit");
  const apps = await listApps();

  return (
    <>
      <PageHeader
        back={{ href: "/admin/team/roles", label: "Roles" }}
        title="New role"
        description="Start with nothing, and open the tabs this role needs."
      />
      <RoleEditor
        role={{ id: null, name: "", description: null, builtin: null, permissions: {}, members: 0 }}
        sections={sections(apps)}
        ceiling={admin.grant}
        editable
        readOnlyReason={null}
      />
    </>
  );
}
