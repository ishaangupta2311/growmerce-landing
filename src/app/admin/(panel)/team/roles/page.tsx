import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { ButtonLink, Card } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";
import { allows } from "@/lib/team/permissions";
import { listRoles } from "@/lib/team/store";

export const metadata: Metadata = { title: "Roles" };

export default async function TeamRolesPage() {
  const admin = await requireAccess("team");
  const roles = await listRoles();

  return (
    <Card
      title={`Roles · ${roles.length}`}
      description="A role decides which tabs its people see, and where they can change things."
      actions={
        allows(admin.grant, "team", "edit") ? (
          <ButtonLink href="/admin/team/roles/new" variant="primary" size="sm">
            <Plus className="size-4" />
            New role
          </ButtonLink>
        ) : undefined
      }
      bodyClassName="p-0 sm:p-0"
    >
      <ul className="divide-y divide-zinc-100">
        {roles.map((role) => (
          <li key={role.id}>
            <Link
              href={`/admin/team/roles/${role.id}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  {role.name}
                  {role.builtin && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                      Ready-made
                    </span>
                  )}
                </p>
                {role.description && <p className="mt-0.5 truncate text-xs text-zinc-500">{role.description}</p>}
              </div>
              <span className="text-xs whitespace-nowrap text-zinc-500">
                {role.members} {role.members === 1 ? "person" : "people"}
                {role.invites > 0 && ` · ${role.invites} invited`}
              </span>
              <ChevronRight aria-hidden className="size-4 text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
