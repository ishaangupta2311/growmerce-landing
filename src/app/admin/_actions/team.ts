"use server";

import { createHash, randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { isOwnerEmail, type Admin } from "@/lib/admin/session";
import { listApps } from "@/lib/apps/store";
import { adminAction, NO_ACCESS, noteActivity, quoted } from "@/lib/blog/action-guard";
import { requireSql, uniqueViolation } from "@/lib/blog/sql";
import { transaction, type Tx } from "@/lib/db";
import type { ActionResult } from "@/lib/blog/types";
import { sendEmail } from "@/lib/email/resend";
import { renderTeamInviteEmail } from "@/lib/email/team-invite-email";
import { SITE_ORIGIN } from "@/lib/site-urls";
import {
  AuthAdminUnavailableError,
  createLogin,
  removeSecondFactors,
  setPassword,
  temporaryPassword,
} from "@/lib/team/auth-admin";
import {
  allows,
  canAssign,
  canManage,
  cleanPermissions,
  covers,
  grantOf,
  sections,
  type Grant,
} from "@/lib/team/permissions";
import {
  addMember,
  deleteInvite,
  deleteRole,
  endSessions,
  hasOpenInvite,
  lockActorRole,
  lockAddress,
  lockInvite,
  lockMember,
  lockRole,
  loginByEmail,
  openInvite,
  removeMember,
  renewInvite,
  saveRole,
  setMemberRole,
  setMustChangePassword,
  type InviteRow,
  type RoleRow,
  type TeamPerson,
} from "@/lib/team/store";

/**
 * Managing the team: people, their roles, and the roles themselves. Every
 * action needs Team → Edit, and then the rule that keeps that permission from
 * being a way to take the rest of the admin:
 *
 * **Nobody hands out more than they hold.** A role can only be given, made or
 * edited by somebody whose own access already covers it (`covers`), and a
 * person can only be changed by somebody whose access covers theirs. Nobody
 * changes their own role, and nobody here can touch an Owner — the Owner is
 * set in the environment, not in the database.
 */

const EDIT_TEAM = ["team", "edit"] as const;
const INVITE_DAYS = 7;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const uuid = z.uuid();

type Failure = Extract<ActionResult, { ok: false }>;

/** This deployment's origin, for the invite link: a preview mails links back to itself. */
async function origin(): Promise<string> {
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host");
  const proto = store.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : SITE_ORIGIN;
}

const BEYOND_YOU = "That role has access you don't have, so you can't give it out.";
const CANT_MANAGE = "You can't change this person: their access goes beyond yours.";

type Locked<T> = { ok: true; value: T } | Failure;

/**
 * What the person acting may do, read again inside the transaction with their
 * membership and role locked. `admin.grant` was read when the request began;
 * if the Owner narrowed their role meanwhile, this waits for that and sees
 * it. Every Team transaction takes this lock first, before what it changes.
 */
async function lockActor(tx: Tx, admin: Admin): Promise<Locked<Grant>> {
  if (admin.owner) return { ok: true, value: admin.grant };
  const role = await lockActorRole(tx, admin.userId);
  const grant = role ? grantOf(role) : null;
  if (!grant || !allows(grant, "team", "edit")) return { ok: false, error: NO_ACCESS };
  return { ok: true, value: grant };
}

/**
 * Locks the member and their role, checks that `admin` may manage them, and
 * runs `work` in the same transaction: a promotion, removal or role edit by
 * somebody else waits until this is done, so it can't land between the check
 * and the change.
 */
async function withManagedMember<T>(
  admin: Admin,
  userId: unknown,
  work: (tx: Tx, person: TeamPerson & { userId: string }, grant: Grant) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const id = uuid.safeParse(userId);
  if (!id.success) return { ok: false, error: "Invalid request." };
  return transaction(requireSql(), async (tx) => {
    const actor = await lockActor(tx, admin);
    if (!actor.ok) return actor;
    const person = await lockMember(tx, id.data);
    if (!person) return { ok: false, error: "That person is no longer on the team." };
    if (isOwnerEmail(person.email)) return { ok: false, error: "That's the Owner, who can't be changed here." };
    if (!canManage({ userId: admin.userId, grant: actor.value }, person)) return { ok: false, error: CANT_MANAGE };
    return work(tx, { ...person, userId: id.data }, actor.value);
  });
}

function friendlyAuthError(err: unknown): Failure {
  if (err instanceof AuthAdminUnavailableError) return { ok: false, error: err.message };
  throw err;
}

/* ---------------------------------------------------------------------------
   People
--------------------------------------------------------------------------- */

const addSchema = z.object({
  name: z.string().trim().min(1, "Enter their name.").max(100, "Keep it under 100 characters."),
  email: z.string().trim().toLowerCase().max(254).regex(EMAIL, "That email address does not look right."),
  roleId: z.uuid("Choose a role."),
  method: z.enum(["invite", "create"]),
});

/** A new invite link: the token for the email, and its hash for the database. */
function newLink(admin: Admin) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return {
    token,
    fresh: { tokenHash, invitedBy: admin.email, expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000) },
  };
}

/** Emails an invite's link, once the invite is saved. */
async function emailInvite(
  admin: Admin,
  invite: { id: string; email: string; name: string; roleName: string },
  token: string,
): Promise<{ emailed: boolean; link: string }> {
  const link = `${await origin()}/admin/join/${token}`;
  const sent = await sendEmail({
    to: invite.email,
    ...renderTeamInviteEmail({
      name: invite.name,
      invitedBy: admin.name,
      roleName: invite.roleName,
      link,
      expiresInDays: INVITE_DAYS,
    }),
    /* Per link, so a resend (a new token) is a new email. */
    idempotencyKey: `team-invite/${invite.id}/${createHash("sha256").update(token).digest("hex").slice(0, 16)}`,
  });
  if (!sent.ok) console.error(`[team] invite email not sent — ${sent.reason}: ${sent.detail}`);
  return { emailed: sent.ok, link };
}

/**
 * Adds somebody, one of two ways. An invite emails a link that works once
 * for seven days; they choose their own password (or sign in with the one
 * they have). Creating the login makes it now with a temporary password the
 * inviter passes on, which they must change on first sign-in.
 *
 * An address with an open invite is refused either way: that invite is
 * changed only by resending or cancelling it, which check the role it
 * offers. Both ways hold the address and the role locked while they check
 * and write, so neither races the other.
 *
 * A partner's login can't join: the admin can approve partners and set their
 * rates, so the two never share an account.
 */
export async function addTeammateAction(
  values: unknown,
): Promise<ActionResult<{ password: string | null; link: string | null }>> {
  return adminAction<{ password: string | null; link: string | null }>("add teammate", EDIT_TEAM, async (admin) => {
    const parsed = addSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { ok: false, error: issue.message, fieldErrors: { [String(issue.path[0])]: issue.message } };
    }
    const { name, email, roleId, method } = parsed.data;
    if (isOwnerEmail(email))
      return { ok: false, error: "That address is the Owner's, who already has every permission." };

    const link = newLink(admin);
    const added = await transaction(
      requireSql(),
      async (tx): Promise<Locked<{ role: RoleRow; inviteId: string | null; password: string | null }>> => {
        const actor = await lockActor(tx, admin);
        if (!actor.ok) return actor;
        await lockAddress(tx, email);
        const role = await lockRole(tx, roleId, "share");
        if (!role) return { ok: false, error: "That role no longer exists.", fieldErrors: { roleId: "Choose a role." } };
        if (!canAssign(actor.value, role)) return { ok: false, error: BEYOND_YOU, fieldErrors: { roleId: BEYOND_YOU } };

        const login = await loginByEmail(email, tx);
        if (login?.member) return { ok: false, error: "That person is already on the team.", fieldErrors: { email: "Already on the team." } };
        if (login?.partner) {
          const error = "That address is an affiliate partner's login. Use a different address for the admin.";
          return { ok: false, error, fieldErrors: { email: error } };
        }
        if (await hasOpenInvite(tx, email)) {
          const error = "There's already an open invite for this address. Resend or cancel it below.";
          return { ok: false, error, fieldErrors: { email: error } };
        }

        if (method === "create") {
          if (login) {
            const error = "That address already has a login. Send an invite instead; they'll sign in with their own password.";
            return { ok: false, error, fieldErrors: { email: error } };
          }
          const password = temporaryPassword();
          try {
            const { userId } = await createLogin(email, password, name);
            await addMember({ userId, email, name, roleId: role.id, mustChangePassword: true, addedBy: admin.email }, tx);
          } catch (err) {
            return friendlyAuthError(err);
          }
          return { ok: true, value: { role, inviteId: null, password } };
        }

        const inviteId = await openInvite({ ...link.fresh, email, name, roleId: role.id }, tx);
        if (!inviteId) return { ok: false, error: "That invite changed meanwhile. Reload and try again." };
        return { ok: true, value: { role, inviteId, password: null } };
      },
    );
    if (!added.ok) return added;
    const { role, inviteId, password } = added.value;

    if (password) {
      await noteActivity(admin, `Created a login for ${email} as ${role.name}`);
      refresh();
      return { ok: true, data: { password, link: null }, message: "Login created." };
    }

    const sent = await emailInvite(admin, { id: inviteId!, email, name, roleName: role.name }, link.token);
    await noteActivity(admin, `Invited ${email} as ${role.name}`);
    refresh();
    return {
      ok: true,
      data: { password: null, link: sent.emailed ? null : sent.link },
      message: sent.emailed ? `Invite sent to ${email}.` : "Invite made, but the email couldn't be sent.",
    };
  });
}

/**
 * Locks the invite and the role it offers, checks that `admin` may give that
 * role out, and runs `work` in the same transaction.
 */
async function withManagedInvite<T>(
  admin: Admin,
  inviteId: unknown,
  work: (tx: Tx, invite: InviteRow) => Promise<Locked<T>>,
): Promise<Locked<T>> {
  const id = uuid.safeParse(inviteId);
  if (!id.success) return { ok: false, error: "Invalid request." };
  return transaction(requireSql(), async (tx) => {
    const actor = await lockActor(tx, admin);
    if (!actor.ok) return actor;
    const invite = await lockInvite(tx, id.data);
    if (!invite) return { ok: false, error: "That invite was already used or cancelled." };
    if (!canAssign(actor.value, invite.role)) return { ok: false, error: BEYOND_YOU };
    return work(tx, invite);
  });
}

/** A new link for an open invite. The old link stops working. */
export async function resendInviteAction(inviteId: unknown): Promise<ActionResult<{ link: string | null }>> {
  return adminAction("resend invite", EDIT_TEAM, async (admin) => {
    const link = newLink(admin);
    const renewed = await withManagedInvite(admin, inviteId, async (tx, invite) =>
      (await renewInvite(invite.id, invite.role.id, link.fresh, tx))
        ? { ok: true as const, value: invite }
        : { ok: false as const, error: "That invite was already used or cancelled." },
    );
    if (!renewed.ok) return renewed;
    const invite = renewed.value;

    const sent = await emailInvite(admin, { ...invite, roleName: invite.role.name }, link.token);
    await noteActivity(admin, `Resent the invite to ${invite.email}`);
    refresh();
    return {
      ok: true,
      data: { link: sent.emailed ? null : sent.link },
      message: sent.emailed ? `New invite sent to ${invite.email}.` : "New link made, but the email couldn't be sent.",
    };
  });
}

export async function cancelInviteAction(inviteId: unknown): Promise<ActionResult> {
  return adminAction("cancel invite", EDIT_TEAM, async (admin) => {
    const cancelled = await withManagedInvite(admin, inviteId, async (tx, invite) =>
      (await deleteInvite(invite.id, tx))
        ? { ok: true as const, value: invite }
        : { ok: false as const, error: "That invite was already used or cancelled." },
    );
    if (!cancelled.ok) return cancelled;
    await noteActivity(admin, `Cancelled the invite to ${cancelled.value.email}`);
    refresh();
    return { ok: true, data: undefined, message: "Invite cancelled." };
  });
}

export async function changeRoleAction(userId: unknown, roleId: unknown): Promise<ActionResult> {
  return adminAction("change role", EDIT_TEAM, (admin) =>
    withManagedMember(admin, userId, async (tx, person, grant) => {
      const id = uuid.safeParse(roleId);
      const role = id.success ? await lockRole(tx, id.data, "share") : null;
      if (!role) return { ok: false, error: "That role no longer exists." };
      if (!canAssign(grant, role)) return { ok: false, error: BEYOND_YOU };

      await setMemberRole(person.userId, role.id, tx);
      await noteActivity(admin, `Changed ${person.email}'s role: ${person.role?.name} → ${role.name}`, tx);
      refresh();
      return { ok: true, data: undefined, message: `${person.name} is now ${role.name}.` };
    }),
  );
}

/**
 * A new temporary password, shown once to whoever reset it. Their sessions
 * end, and they choose their own password the next time they sign in.
 */
export async function resetPasswordAction(userId: unknown): Promise<ActionResult<{ password: string }>> {
  return adminAction("reset password", EDIT_TEAM, (admin) =>
    withManagedMember<{ password: string }>(admin, userId, async (tx, person) => {
      const password = temporaryPassword();
      try {
        await setPassword(person.userId, password);
      } catch (err) {
        return friendlyAuthError(err);
      }
      await setMustChangePassword(person.userId, true, tx);
      await endSessions(person.userId, tx);
      await noteActivity(admin, `Reset ${person.email}'s password`, tx);
      refresh();
      return { ok: true, data: { password }, message: "Password reset." };
    }),
  );
}

export async function signOutEverywhereAction(userId: unknown): Promise<ActionResult> {
  return adminAction("sign out everywhere", EDIT_TEAM, (admin) =>
    withManagedMember(admin, userId, async (tx, person) => {
      await endSessions(person.userId, tx);
      await noteActivity(admin, `Signed ${person.email} out everywhere`, tx);
      return { ok: true, data: undefined, message: `${person.name} is signed out everywhere.` };
    }),
  );
}

/** For somebody who lost the phone their codes were on. */
export async function resetTwoStepAction(userId: unknown): Promise<ActionResult> {
  return adminAction("reset two-step login", EDIT_TEAM, (admin) =>
    withManagedMember(admin, userId, async (tx, person) => {
      try {
        await removeSecondFactors(person.userId);
      } catch (err) {
        return friendlyAuthError(err);
      }
      await endSessions(person.userId, tx);
      await noteActivity(admin, `Turned off ${person.email}'s two-step login`, tx);
      refresh();
      return {
        ok: true,
        data: undefined,
        message: `${person.name} can sign in with their password alone until they turn it back on.`,
      };
    }),
  );
}

/**
 * Takes somebody off the team. Their next request in the admin is a 404; the
 * login itself stays, since nothing else here owns it.
 */
export async function removeTeammateAction(userId: unknown): Promise<ActionResult> {
  return adminAction("remove teammate", EDIT_TEAM, (admin) =>
    withManagedMember(admin, userId, async (tx, person) => {
      await removeMember(person.userId, tx);
      await noteActivity(admin, `Removed ${person.email} from the team`, tx);
      refresh();
      return { ok: true, data: undefined, message: `${person.name} is off the team.` };
    }),
  );
}

/* ---------------------------------------------------------------------------
   Roles
--------------------------------------------------------------------------- */

const roleSchema = z.object({
  name: z.string().trim().min(1, "Give the role a name.").max(40, "Keep the name under 40 characters."),
  description: z
    .string()
    .trim()
    .max(200, "Keep the description under 200 characters.")
    .transform((value) => value || null),
  permissions: z.record(z.string(), z.unknown()),
});

export async function saveRoleAction(roleId: unknown, values: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("save role", EDIT_TEAM, async (admin) => {
    const id = roleId === null ? null : uuid.safeParse(roleId);
    if (id && !id.success) return { ok: false, error: "Invalid request." };
    const parsed = roleSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { ok: false, error: issue.message, fieldErrors: { [String(issue.path[0])]: issue.message } };
    }

    const tabs = sections(await listApps()).flatMap((section) => section.tabs);
    const permissions = cleanPermissions(parsed.data.permissions, tabs);

    try {
      /* Locked while checked and saved: an edit elsewhere can't widen the
         role between this check and this write. */
      const saved = await transaction(requireSql(), async (tx): Promise<Locked<{ id: string; edited: boolean }>> => {
        const actor = await lockActor(tx, admin);
        if (!actor.ok) return actor;
        if (!covers(actor.value, { all: null, permissions }))
          return { ok: false, error: "You can only give a role access you have yourself." };
        const existing = id ? await lockRole(tx, id.data, "update") : null;
        if (id && !existing) return { ok: false, error: "That role no longer exists." };
        if (existing?.builtin)
          return { ok: false, error: "The ready-made roles can't be changed. Make a new role instead." };
        /* Editing a role changes everybody who holds it, so the editor must
           already cover both what it was and what it becomes. */
        if (existing && !canAssign(actor.value, existing))
          return { ok: false, error: "This role has access you don't have, so you can't edit it." };

        const savedId = await saveRole(
          existing?.id ?? null,
          { name: parsed.data.name, description: parsed.data.description, permissions },
          tx,
        );
        if (!savedId) return { ok: false, error: "That role no longer exists." };
        return { ok: true, value: { id: savedId, edited: existing !== null } };
      });
      if (!saved.ok) return saved;
      await noteActivity(admin, `${saved.value.edited ? "Edited" : "Made"} the role ${quoted(parsed.data.name)}`);
      refresh();
      return { ok: true, data: { id: saved.value.id }, message: saved.value.edited ? "Role saved." : "Role made." };
    } catch (err) {
      if (uniqueViolation(err) !== null) {
        return { ok: false, error: "There's already a role with that name.", fieldErrors: { name: "Already taken." } };
      }
      throw err;
    }
  });
}

export async function deleteRoleAction(roleId: unknown): Promise<ActionResult> {
  return adminAction("delete role", EDIT_TEAM, async (admin) => {
    const id = uuid.safeParse(roleId);
    if (!id.success) return { ok: false, error: "Invalid request." };
    const deleted = await transaction(requireSql(), async (tx): Promise<Locked<RoleRow>> => {
      const actor = await lockActor(tx, admin);
      if (!actor.ok) return actor;
      const role = await lockRole(tx, id.data, "update");
      if (!role || role.builtin) return { ok: false, error: "That role can't be deleted." };
      if (!canAssign(actor.value, role))
        return { ok: false, error: "This role has access you don't have, so you can't delete it." };

      const outcome = await deleteRole(role.id, tx);
      if (outcome === "in-use") {
        return {
          ok: false,
          error: "People still hold this role, or an open invite offers it. Move them to another role first.",
        };
      }
      if (outcome === "missing") return { ok: false, error: "That role no longer exists." };
      return { ok: true, value: role };
    });
    if (!deleted.ok) return deleted;
    await noteActivity(admin, `Deleted the role ${quoted(deleted.value.name)}`);
    refresh();
    return { ok: true, data: undefined, message: "Role deleted." };
  });
}
