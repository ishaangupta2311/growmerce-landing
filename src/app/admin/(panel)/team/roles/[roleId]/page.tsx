import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import RoleEditor from "@/components/admin/team/RoleEditor";
import { PageHeader } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";
import { listApps } from "@/lib/apps/store";
import { allows, canAssign, sections } from "@/lib/team/permissions";
import { listRoles } from "@/lib/team/store";

export const metadata: Metadata = { title: "Role" };

export default async function TeamRolePage({ params }: PageProps<"/admin/team/roles/[roleId]">) {
  const admin = await requireAccess("team");
  const id = z.uuid().safeParse((await params).roleId);
  if (!id.success) notFound();
  const [roles, apps] = await Promise.all([listRoles(), listApps()]);
  const role = roles.find((candidate) => candidate.id === id.data);
  if (!role) notFound();

  const canEdit = allows(admin.grant, "team", "edit");
  const readOnlyReason = role.builtin
    ? role.builtin === "admin"
      ? "Ready-made: Admin can see and change everything, including tabs and apps added later. Make a new role for anything narrower."
      : "Ready-made: Viewer can see everything, including tabs and apps added later, and change nothing."
    : !canEdit
      ? "View only. Your role can see roles but not change them."
      : !canAssign(admin.grant, role)
        ? "This role has access you don't have, so you can't edit it."
        : null;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/team/roles", label: "Roles" }}
        title={role.name}
        description={`${role.members} ${role.members === 1 ? "person has" : "people have"} this role.`}
      />
      <RoleEditor
        role={{ ...role }}
        sections={sections(apps)}
        ceiling={admin.grant}
        editable={readOnlyReason === null}
        readOnlyReason={readOnlyReason}
      />
    </>
  );
}
