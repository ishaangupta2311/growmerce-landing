import type { Metadata } from "next";

import MembersPanel from "@/components/admin/team/MembersPanel";
import { ownerList, requireAccess } from "@/lib/admin/session";
import { authAdminConfigured } from "@/lib/team/auth-admin";
import { allows, canAssign, canManage } from "@/lib/team/permissions";
import { listInvites, listPeople, listRoles } from "@/lib/team/store";

export const metadata: Metadata = { title: "Team" };

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));
}

/**
 * Everybody who can sign in to the admin, and the invites still open. Which
 * rows can be changed, and which roles can be given, is worked out here with
 * the same rules the Team actions enforce, so the menus only offer what would
 * be allowed.
 */
export default async function TeamMembersPage() {
  const admin = await requireAccess("team");
  const canEdit = allows(admin.grant, "team", "edit");
  const [people, invites, roles] = await Promise.all([listPeople(ownerList()), listInvites(), listRoles()]);

  return (
    <MembersPanel
      you={admin.userId}
      canEdit={canEdit}
      canCreateLogins={authAdminConfigured()}
      people={people.map((person) => ({ ...person, manageable: canEdit && canManage(admin, person) }))}
      invites={invites.map((invite) => ({
        ...invite,
        manageable: canEdit && canAssign(admin.grant, invite.role),
        expiresInDays: daysUntil(invite.expiresAt),
      }))}
      roles={roles
        .filter((role) => canAssign(admin.grant, role))
        .map((role) => ({ id: role.id, name: role.name, description: role.description }))}
    />
  );
}
