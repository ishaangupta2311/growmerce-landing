"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, Lock, Trash2 } from "lucide-react";

import { deleteRoleAction, saveRoleAction } from "@/app/admin/_actions/team";
import { ConfirmDialog, useToast } from "@/components/admin/overlay";
import { Button, Card, Field, Input } from "@/components/admin/ui";
import { clsx } from "@/lib/clsx";
import { allows, type Grant, type Level, type Permissions, type Section, type Tab } from "@/lib/team/permissions";

type Access = "none" | Level;

const LABEL: Record<Access, string> = { none: "None", view: "View", edit: "Edit" };

function accessOf(permissions: Permissions, tab: Tab): Access {
  return permissions[tab.key] ?? "none";
}

/** None / View / Edit, for one tab or a whole section. */
function Levels({
  value,
  options,
  disabled,
  onChange,
  label,
}: {
  value: Access | null;
  options: readonly Access[];
  disabled: (access: Access) => boolean;
  onChange: (access: Access) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex overflow-hidden rounded-lg border border-zinc-200 bg-white"
    >
      {options.map((access, index) => {
        const on = value === access;
        return (
          <button
            key={access}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled(access)}
            onClick={() => onChange(access)}
            className={clsx(
              "px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:relative focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed",
              index > 0 && "border-l border-zinc-200",
              on
                ? access === "edit"
                  ? "bg-brand text-white"
                  : "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-50 disabled:opacity-40",
            )}
          >
            {LABEL[access]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * One role: its name and its grid of tabs. A section's row sets every tab in
 * it, and says "Mixed" when they differ. Levels beyond the editor's own
 * access are greyed out: the server refuses them anyway (see `covers`).
 */
export default function RoleEditor({
  role,
  sections,
  ceiling,
  editable,
  readOnlyReason,
}: {
  role: {
    id: string | null;
    name: string;
    description: string | null;
    builtin: "admin" | "viewer" | null;
    permissions: Permissions;
    members: number;
  };
  sections: Section[];
  ceiling: Grant;
  editable: boolean;
  readOnlyReason: string | null;
}) {
  const router = useRouter();
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [permissions, setPermissions] = useState<Permissions>(() => {
    if (!role.builtin) return role.permissions;
    /* The ready-made roles hold a level on every tab; shown as the grid they amount to. */
    const level: Level = role.builtin === "admin" ? "edit" : "view";
    return Object.fromEntries(
      sections.flatMap((section) => section.tabs).map((tab) => [tab.key, tab.levels.includes(level) ? level : "view"]),
    );
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);

  const optionsFor = (tab: Tab): Access[] => ["none", ...tab.levels];
  const beyond = (tab: Tab, access: Access) => access !== "none" && !allows(ceiling, tab.key, access);

  function setTab(tab: Tab, access: Access) {
    setPermissions((current) => {
      const next = { ...current };
      if (access === "none") delete next[tab.key];
      else next[tab.key] = access;
      return next;
    });
  }

  function setSection(section: Section, access: Access) {
    for (const tab of section.tabs) {
      /* "Edit" on a section leaves view-only tabs at view. */
      const level: Access = access === "edit" && !tab.levels.includes("edit") ? "view" : access;
      if (!beyond(tab, level)) setTab(tab, level);
    }
  }

  function sectionValue(section: Section): Access | null {
    const values = new Set(
      section.tabs.map((tab) => {
        const access = accessOf(permissions, tab);
        /* A view-only tab at view counts as "edit" when the rest of the section is. */
        return access === "view" && !tab.levels.includes("edit") ? "edit-or-view" : access;
      }),
    );
    if (values.size === 1) {
      const [only] = values;
      return only === "edit-or-view" ? "view" : (only as Access);
    }
    if (values.size === 2 && values.has("edit-or-view") && values.has("edit")) return "edit";
    return null;
  }

  const save = () =>
    startTransition(async () => {
      const result = await saveRoleAction(role.id, { name, description, permissions });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        notify(result.error, "error");
        return;
      }
      setErrors({});
      notify(result.message ?? "Saved.");
      if (!role.id) router.push(`/admin/team/roles/${result.data.id}`);
    });

  return (
    <div className="space-y-5">
      {readOnlyReason && (
        <p className="flex items-start gap-2 rounded-[10px] border border-sky-100 bg-sky-50 px-3.5 py-2.5 text-[13px] text-sky-900">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
          {readOnlyReason}
        </p>
      )}

      <Card title="About the role">
        <fieldset disabled={!editable} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="role-name" error={errors.name}>
            <Input id="role-name" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Description (optional)" htmlFor="role-description" error={errors.description}>
            <Input
              id="role-description"
              value={description}
              maxLength={200}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
        </fieldset>
      </Card>

      <Card
        title="What it can open"
        description="None hides the tab. View shows it. Edit lets them change things there."
        bodyClassName="p-0 sm:p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-zinc-100">
              {sections.map((section) => {
                const grouped = section.tabs.length > 1 || section.tabs[0]?.label !== section.label;
                return [
                  grouped && (
                    <tr key={section.label} className="bg-zinc-50/80">
                      <td className="px-4 py-2.5 font-bold text-zinc-900 sm:px-5">{section.label}</td>
                      <td className="px-4 py-2.5 text-right sm:px-5">
                        <div className="inline-flex items-center gap-2">
                          {sectionValue(section) === null && (
                            <span className="text-xs font-semibold text-zinc-400">Mixed</span>
                          )}
                          <Levels
                            label={`${section.label}, every tab`}
                            value={sectionValue(section)}
                            options={
                              section.tabs.some((tab) => tab.levels.includes("edit"))
                                ? ["none", "view", "edit"]
                                : ["none", "view"]
                            }
                            disabled={(access) =>
                              !editable ||
                              section.tabs.every((tab) =>
                                beyond(tab, access === "edit" && !tab.levels.includes("edit") ? "view" : access),
                              )
                            }
                            onChange={(access) => setSection(section, access)}
                          />
                        </div>
                      </td>
                    </tr>
                  ),
                  ...section.tabs.map((tab) => (
                    <tr key={tab.key}>
                      <td
                        className={clsx(
                          "py-2.5 pr-4",
                          grouped ? "pl-8 sm:pl-10" : "px-4 font-bold text-zinc-900 sm:px-5",
                        )}
                      >
                        <span className={grouped ? "font-medium text-zinc-800" : undefined}>{tab.label}</span>
                        {tab.hint && <span className="ml-1.5 text-xs font-normal text-zinc-500">· {tab.hint}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right sm:px-5">
                        <Levels
                          label={grouped ? `${section.label}: ${tab.label}` : tab.label}
                          value={accessOf(permissions, tab)}
                          options={optionsFor(tab)}
                          disabled={(access) => !editable || beyond(tab, access)}
                          onChange={(access) => setTab(tab, access)}
                        />
                      </td>
                    </tr>
                  )),
                ];
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {editable && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            {role.id ? "Save role" : "Make role"}
          </Button>
          {role.id && (
            <Button variant="dangerGhost" onClick={() => setDeleting(true)} disabled={pending}>
              <Trash2 className="size-4" />
              Delete role
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        pending={pending}
        title={`Delete the role “${role.name}”?`}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteRoleAction(role.id);
            if (!result.ok) {
              notify(result.error, "error");
              setDeleting(false);
              return;
            }
            notify(result.message ?? "Role deleted.");
            router.push("/admin/team/roles");
          })
        }
      >
        {role.members > 0
          ? `${role.members} ${role.members === 1 ? "person holds" : "people hold"} this role. Move them to another role first.`
          : "Nobody holds this role, so nothing else changes."}
      </ConfirmDialog>
    </div>
  );
}
