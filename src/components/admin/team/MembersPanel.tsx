"use client";

import { useRef, useState, useTransition } from "react";
import {
  Check,
  Copy,
  Ellipsis,
  KeyRound,
  LoaderCircle,
  LogOut,
  MailPlus,
  Plus,
  Shield,
  Smartphone,
  Trash2,
  UserCog,
  X,
} from "lucide-react";

import {
  addTeammateAction,
  cancelInviteAction,
  changeRoleAction,
  removeTeammateAction,
  resendInviteAction,
  resetPasswordAction,
  resetTwoStepAction,
  signOutEverywhereAction,
} from "@/app/admin/_actions/team";
import { ConfirmDialog, LocalTime, Modal, useToast } from "@/components/admin/overlay";
import { Button, buttonClass, Card, EmptyState, Field, Input, Select } from "@/components/admin/ui";
import { clsx } from "@/lib/clsx";
import type { InviteRow, TeamPerson } from "@/lib/team/store";

type Person = TeamPerson & { manageable: boolean };
type Invite = InviteRow & { manageable: boolean; expiresInDays: number };
type RoleOption = { id: string; name: string; description: string | null };

type Result = { ok: true; message?: string } | { ok: false; error: string };

const ITEM =
  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50";

function initials(name: string, email: string): string {
  const parts = (name.trim() || email).split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function Chip({ tone, children }: { tone: "brand" | "sky" | "ok" | "off" | "warn"; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        {
          brand: "bg-orange-50 text-orange-800",
          sky: "bg-sky-50 text-sky-800",
          ok: "bg-emerald-50 text-emerald-700",
          off: "bg-zinc-100 text-zinc-600",
          warn: "bg-amber-50 text-amber-800",
        }[tone],
      )}
    >
      {children}
    </span>
  );
}

/**
 * The "…" menu on a row. A popover renders in the top layer, so the table's
 * scroll container can't clip it; it is placed under its button by hand, and
 * closes when any item in it is chosen.
 */
function RowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={buttonClass("ghost", "icon")}
        aria-label={label}
        aria-haspopup="menu"
        onClick={() => {
          const button = trigger.current;
          const panel = menu.current;
          if (!button || !panel) return;
          const rect = button.getBoundingClientRect();
          panel.style.top = `${Math.min(rect.bottom + 4, window.innerHeight - 260)}px`;
          panel.style.left = `${Math.max(8, rect.right - 224)}px`;
          panel.showPopover();
        }}
      >
        <Ellipsis className="size-4" />
      </button>
      <div
        ref={menu}
        popover="auto"
        role="menu"
        className="fixed m-0 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('[role="menuitem"]')) menu.current?.hidePopover();
        }}
      >
        {children}
      </div>
    </>
  );
}

/** A password or link shown once, with a copy button. */
function Secret({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-100 px-3 py-2 font-mono text-[13px] text-zinc-900">
        {value}
      </code>
      <Button
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        }}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

type Reveal = { title: string; intro: string; value: string; note: string };

export default function MembersPanel({
  you,
  canEdit,
  canCreateLogins,
  people,
  invites,
  roles,
}: {
  you: string;
  canEdit: boolean;
  canCreateLogins: boolean;
  people: Person[];
  invites: Invite[];
  roles: RoleOption[];
}) {
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [changing, setChanging] = useState<Person | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: React.ReactNode;
    label: string;
    run: () => Promise<Result>;
  } | null>(null);

  function run(work: () => Promise<Result>, after?: () => void) {
    startTransition(async () => {
      const result = await work();
      if (result.ok) {
        if (result.message) notify(result.message);
        after?.();
      } else {
        notify(result.error, "error");
      }
    });
  }

  return (
    <>
      <Card
        title={`Members · ${people.length}`}
        description="The Owner is set in the site's settings and can't be changed here."
        actions={
          canEdit && roles.length > 0 ? (
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Add teammate
            </Button>
          ) : undefined
        }
        bodyClassName="p-0 sm:p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                <th className="px-4 py-2.5 sm:px-5">Person</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="hidden px-3 py-2.5 md:table-cell">2-step login</th>
                <th className="hidden px-3 py-2.5 md:table-cell">Last signed in</th>
                <th className="w-12 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {people.map((person) => (
                <tr key={person.userId ?? person.email}>
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden
                        className={clsx(
                          "grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold",
                          person.owner ? "bg-brand/10 text-brand" : "bg-zinc-100 text-zinc-600",
                        )}
                      >
                        {initials(person.name, person.email)}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-semibold text-zinc-900">
                          {person.name}
                          {person.userId === you && <Chip tone="off">You</Chip>}
                        </p>
                        <p className="truncate text-xs text-zinc-500">{person.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {person.owner ? <Chip tone="brand">Owner</Chip> : <Chip tone="sky">{person.role?.name}</Chip>}
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    {person.twoFactor ? <Chip tone="ok">On</Chip> : <Chip tone="off">Off</Chip>}
                  </td>
                  <td className="hidden px-3 py-3 text-zinc-600 md:table-cell">
                    {person.mustChangePassword ? (
                      <Chip tone="warn">Must change password</Chip>
                    ) : person.lastSignInAt ? (
                      <LocalTime iso={person.lastSignInAt} />
                    ) : (
                      <span className="text-zinc-400">{person.userId ? "Never" : "No login yet"}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {person.manageable && (
                      <RowMenu label={`Actions for ${person.name}`}>
                        <>
                          <button
                            role="menuitem"
                            type="button"
                            className={ITEM}
                            onClick={() => {
                              setChanging(person);
                            }}
                          >
                            <UserCog className="size-4 text-zinc-400" /> Change role
                          </button>
                          {canCreateLogins && (
                            <button
                              role="menuitem"
                              type="button"
                              className={ITEM}
                              onClick={() => {
                                setConfirm({
                                  title: `Reset ${person.name}'s password?`,
                                  label: "Reset password",
                                  body: "They're signed out everywhere, and you get a temporary password to send them. They choose a new one when they sign in.",
                                  run: async () => {
                                    const result = await resetPasswordAction(person.userId);
                                    if (result.ok) {
                                      setReveal({
                                        title: "New temporary password",
                                        intro: `Send this to ${person.name} yourself. It's shown only once.`,
                                        value: result.data.password,
                                        note: "They'll be asked to choose their own password when they sign in.",
                                      });
                                    }
                                    return result;
                                  },
                                });
                              }}
                            >
                              <KeyRound className="size-4 text-zinc-400" /> Reset password
                            </button>
                          )}
                          <button
                            role="menuitem"
                            type="button"
                            className={ITEM}
                            onClick={() => {
                              setConfirm({
                                title: `Sign ${person.name} out everywhere?`,
                                label: "Sign out",
                                body: "Every browser they're signed in on is signed out. They can sign straight back in with their password.",
                                run: () => signOutEverywhereAction(person.userId),
                              });
                            }}
                          >
                            <LogOut className="size-4 text-zinc-400" /> Sign out everywhere
                          </button>
                          {person.twoFactor && canCreateLogins && (
                            <button
                              role="menuitem"
                              type="button"
                              className={ITEM}
                              onClick={() => {
                                setConfirm({
                                  title: `Turn off ${person.name}'s 2-step login?`,
                                  label: "Turn off",
                                  body: "For somebody who lost their phone. They sign in with their password alone until they turn it back on under My account.",
                                  run: () => resetTwoStepAction(person.userId),
                                });
                              }}
                            >
                              <Smartphone className="size-4 text-zinc-400" /> Turn off 2-step login
                            </button>
                          )}
                          <div className="my-1 h-px bg-zinc-100" />
                          <button
                            role="menuitem"
                            type="button"
                            className={`${ITEM} text-red-600 hover:bg-red-50`}
                            onClick={() => {
                              setConfirm({
                                title: `Remove ${person.name} from the team?`,
                                label: "Remove",
                                body: "They lose the admin straight away. Their login isn't deleted, and you can invite them again later.",
                                run: () => removeTeammateAction(person.userId),
                              });
                            }}
                          >
                            <Trash2 className="size-4" /> Remove from team
                          </button>
                        </>
                      </RowMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title={`Invites · ${invites.length}`}
        description="Links that haven't been used yet. Each works once."
        className="mt-5"
        bodyClassName="p-0 sm:p-0"
      >
        {invites.length === 0 ? (
          <EmptyState icon={<MailPlus className="size-5" />} title="No open invites" />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-900">{invite.name}</p>
                  <p className="truncate text-xs text-zinc-500">{invite.email}</p>
                </div>
                <Chip tone="sky">{invite.role.name}</Chip>
                <span className="hidden text-xs text-zinc-500 sm:inline">
                  {invite.expiresInDays <= 1 ? "Expires within a day" : `Expires in ${invite.expiresInDays} days`}
                </span>
                {invite.manageable && (
                  <RowMenu label={`Actions for the invite to ${invite.email}`}>
                    <>
                      <button
                        role="menuitem"
                        type="button"
                        className={ITEM}
                        disabled={pending}
                        onClick={() => {
                          run(async () => {
                            const result = await resendInviteAction(invite.id);
                            if (result.ok && result.data.link) {
                              setReveal({
                                title: "Invite link",
                                intro: `The email to ${invite.email} couldn't be sent. Send them this link yourself.`,
                                value: result.data.link,
                                note: "It works once, for 7 days. Whoever opens it can join as this address.",
                              });
                            }
                            return result;
                          });
                        }}
                      >
                        <MailPlus className="size-4 text-zinc-400" /> Resend invite
                      </button>
                      <button
                        role="menuitem"
                        type="button"
                        className={`${ITEM} text-red-600 hover:bg-red-50`}
                        onClick={() => {
                          setConfirm({
                            title: "Cancel this invite?",
                            label: "Cancel invite",
                            body: `The link sent to ${invite.email} stops working.`,
                            run: () => cancelInviteAction(invite.id),
                          });
                        }}
                      >
                        <X className="size-4" /> Cancel invite
                      </button>
                    </>
                  </RowMenu>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {adding && (
        <AddTeammate
          roles={roles}
          canCreateLogins={canCreateLogins}
          onClose={() => setAdding(false)}
          onReveal={(value) => {
            setAdding(false);
            setReveal(value);
          }}
        />
      )}

      {changing && (
        <ChangeRole
          person={changing}
          roles={roles}
          pending={pending}
          onClose={() => setChanging(null)}
          onSave={(roleId) =>
            run(
              () => changeRoleAction(changing.userId, roleId),
              () => setChanging(null),
            )
          }
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        pending={pending}
        title={confirm?.title ?? ""}
        confirmLabel={confirm?.label}
        onConfirm={() => confirm && run(confirm.run, () => setConfirm(null))}
      >
        {confirm?.body}
      </ConfirmDialog>

      <Modal
        open={reveal !== null}
        onClose={() => setReveal(null)}
        title={reveal?.title}
        description={reveal?.intro}
        footer={
          <Button variant="primary" onClick={() => setReveal(null)}>
            Done
          </Button>
        }
      >
        {reveal && (
          <div className="space-y-3">
            <Secret value={reveal.value} />
            <p className="text-xs leading-relaxed text-zinc-500">{reveal.note}</p>
          </div>
        )}
      </Modal>
    </>
  );
}

function AddTeammate({
  roles,
  canCreateLogins,
  onClose,
  onReveal,
}: {
  roles: RoleOption[];
  canCreateLogins: boolean;
  onClose: () => void;
  onReveal: (reveal: Reveal) => void;
}) {
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles.find((role) => role.name === "Viewer")?.id ?? roles[0]?.id ?? "");
  const [method, setMethod] = useState<"invite" | "create">("invite");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const role = roles.find((candidate) => candidate.id === roleId);

  const submit = () =>
    startTransition(async () => {
      const result = await addTeammateAction({ name, email, roleId, method });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        notify(result.error, "error");
        return;
      }
      if (result.data.password) {
        onReveal({
          title: `Login created for ${name.trim()}`,
          intro: `Send them their email address and this temporary password yourself. It's shown only once.`,
          value: result.data.password,
          note: "They sign in at growmerce.ai/admin and choose their own password straight away.",
        });
      } else if (result.data.link) {
        onReveal({
          title: "Invite link",
          intro: `The invite email to ${email.trim()} couldn't be sent. Send them this link yourself.`,
          value: result.data.link,
          note: "It works once, for 7 days. Whoever opens it can join as this address.",
        });
      } else {
        notify(result.message ?? "Invite sent.");
        onClose();
      }
    });

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title="Add a teammate"
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            {method === "invite" ? "Send invite" : "Create login"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="teammate-name" error={errors.name}>
            <Input
              id="teammate-name"
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Email" htmlFor="teammate-email" error={errors.email}>
            <Input
              id="teammate-email"
              type="email"
              value={email}
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Role" htmlFor="teammate-role" error={errors.roleId} hint={role?.description ?? undefined}>
          <Select id="teammate-role" value={roleId} onChange={(event) => setRoleId(event.target.value)}>
            {roles.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-[13px] font-semibold text-zinc-700">How they get in</legend>
          <MethodOption
            checked={method === "invite"}
            onSelect={() => setMethod("invite")}
            title="Email them an invite"
            detail="A link that works once, for 7 days. They choose their own password, or sign in with the login they already have."
          />
          <MethodOption
            checked={method === "create"}
            onSelect={() => setMethod("create")}
            disabled={!canCreateLogins}
            title="Create their login now"
            detail={
              canCreateLogins
                ? "You get a temporary password to send them yourself. They must change it the first time they sign in."
                : "Needs SUPABASE_SECRET_KEY set on this site."
            }
          />
        </fieldset>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function MethodOption({
  checked,
  onSelect,
  title,
  detail,
  disabled = false,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={clsx(
        "flex cursor-pointer gap-3 rounded-xl border px-3.5 py-3",
        checked ? "border-brand ring-1 ring-brand" : "border-zinc-200 hover:border-zinc-300",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="radio"
        name="method"
        className="mt-0.5 accent-[var(--color-brand)]"
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
      />
      <span>
        <span className="block text-sm font-semibold text-zinc-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{detail}</span>
      </span>
    </label>
  );
}

function ChangeRole({
  person,
  roles,
  pending,
  onClose,
  onSave,
}: {
  person: Person;
  roles: RoleOption[];
  pending: boolean;
  onClose: () => void;
  onSave: (roleId: string) => void;
}) {
  const [roleId, setRoleId] = useState(person.role?.id ?? roles[0]?.id ?? "");
  const role = roles.find((candidate) => candidate.id === roleId);
  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={`Change ${person.name}'s role`}
      description="It applies on their next click."
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(roleId)} disabled={pending || roleId === person.role?.id}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            Save
          </Button>
        </>
      }
    >
      <Field label="Role" htmlFor="change-role" hint={role?.description ?? undefined}>
        <Select id="change-role" value={roleId} onChange={(event) => setRoleId(event.target.value)}>
          {roles.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </Select>
      </Field>
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
        <Shield className="mt-0.5 size-3.5 shrink-0" />
        Only roles within your own access are listed.
      </p>
    </Modal>
  );
}
