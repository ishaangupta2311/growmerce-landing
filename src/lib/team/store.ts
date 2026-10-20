import "server-only";

import type { Sql } from "postgres";

import { requireSql } from "@/lib/blog/sql";
import { transaction } from "@/lib/db";
import { grantOf, type Grant, type Permissions } from "./permissions";

/**
 * The team, the database side (migrations/0012_team.sql): members, roles,
 * invites and the activity log, plus the few reads of Supabase's own
 * `auth` tables the Team page needs. Writes to `auth` go through the auth
 * server instead (see ./auth-admin.ts), with one exception noted below.
 *
 * Nothing here checks who is asking. Callers have passed `requireAccess` and
 * the escalation rules in the Team actions. Those rules are checked and
 * applied in one transaction, on rows locked by the `lock…` functions below,
 * so nobody else's change can land between the check and the write: each
 * write takes an optional `db`, the transaction's connection.
 */

export type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  builtin: "admin" | "viewer" | null;
  permissions: Permissions;
};

export type RoleSummary = RoleRow & { members: number; invites: number };

type RoleRecord = {
  role_id: string;
  role_name: string;
  role_description: string | null;
  builtin: "admin" | "viewer" | null;
  permissions: Permissions;
};

/** The role columns every query here selects, as `r`. A constant, so `unsafe` is safe. */
const ROLE_COLUMNS =
  "r.id as role_id, r.name as role_name, r.description as role_description, r.builtin, r.permissions";

function toRole(row: RoleRecord): RoleRow {
  return {
    id: row.role_id,
    name: row.role_name,
    description: row.role_description,
    builtin: row.builtin,
    permissions: row.permissions ?? {},
  };
}

/* ---------------------------------------------------------------------------
   Standing: the check behind every admin request
--------------------------------------------------------------------------- */

export async function memberStanding(userId: string): Promise<{
  roleName: string;
  roleId: string;
  grant: Grant;
  mustChangePassword: boolean;
  name: string;
} | null> {
  const sql = requireSql();
  const [row] = await sql<(RoleRecord & { must_change_password: boolean; name: string })[]>`
    select ${sql.unsafe(ROLE_COLUMNS)}, m.must_change_password, m.name
    from team.member m
    join team.role r on r.id = m.role_id
    where m.user_id = ${userId}
  `;
  if (!row) return null;
  return {
    roleName: row.role_name,
    roleId: row.role_id,
    grant: grantOf(toRole(row)),
    mustChangePassword: row.must_change_password,
    name: row.name,
  };
}

/* ---------------------------------------------------------------------------
   People
--------------------------------------------------------------------------- */

export type TeamPerson = {
  userId: string | null;
  email: string;
  name: string;
  owner: boolean;
  role: RoleRow | null;
  mustChangePassword: boolean;
  twoFactor: boolean;
  lastSignInAt: string | null;
};

type PersonRecord = {
  user_id: string | null;
  email: string;
  name: string | null;
  must_change_password: boolean;
  two_factor: boolean;
  last_sign_in_at: Date | null;
};

function toPerson(row: PersonRecord, owner: boolean, role: RoleRow | null): TeamPerson {
  return {
    userId: row.user_id,
    email: row.email,
    name: row.name || row.email.split("@")[0],
    owner,
    role,
    mustChangePassword: row.must_change_password,
    twoFactor: row.two_factor,
    lastSignInAt: row.last_sign_in_at?.toISOString() ?? null,
  };
}

/**
 * Everybody on the team: the Owners first (from the environment, with their
 * login if they have one yet), then the members in the order they joined.
 */
export async function listPeople(ownerEmails: readonly string[]): Promise<TeamPerson[]> {
  const sql = requireSql();
  const [owners, members] = await Promise.all([
    sql<PersonRecord[]>`
      select u.id as user_id, lower(u.email) as email, a.name, false as must_change_password,
             exists (select 1 from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified') as two_factor,
             u.last_sign_in_at
      from auth.users u
      left join blog.admin_user a on a.email = lower(u.email)
      where lower(u.email) = any(${[...ownerEmails]}::text[])
    `,
    sql<(PersonRecord & RoleRecord)[]>`
      select m.user_id, lower(u.email) as email, coalesce(a.name, m.name) as name, m.must_change_password,
             exists (select 1 from auth.mfa_factors f where f.user_id = m.user_id and f.status = 'verified') as two_factor,
             u.last_sign_in_at, ${sql.unsafe(ROLE_COLUMNS)}
      from team.member m
      join team.role r on r.id = m.role_id
      join auth.users u on u.id = m.user_id
      left join blog.admin_user a on a.email = lower(u.email)
      order by m.created_at
    `,
  ]);

  const signedUp = new Map(owners.map((row) => [row.email, row]));
  return [
    ...ownerEmails.map((email) =>
      toPerson(
        signedUp.get(email) ?? {
          user_id: null,
          email,
          name: null,
          must_change_password: false,
          two_factor: false,
          last_sign_in_at: null,
        },
        true,
        null,
      ),
    ),
    /* An Owner who also has a member row (added before going on the list) is
       the Owner, and listed once, above. */
    ...members.filter((row) => !ownerEmails.includes(row.email)).map((row) => toPerson(row, false, toRole(row))),
  ];
}

export async function addMember(member: {
  userId: string;
  email: string;
  name: string;
  roleId: string;
  mustChangePassword: boolean;
  addedBy: string;
}, db: Sql = requireSql()): Promise<void> {
  const sql = db;
  await sql`
    insert into team.member (user_id, email, name, role_id, must_change_password, added_by)
    values (${member.userId}, ${member.email}, ${member.name}, ${member.roleId}, ${member.mustChangePassword}, ${member.addedBy})
  `;
}

export async function setMemberRole(userId: string, roleId: string, db: Sql = requireSql()): Promise<boolean> {
  const sql = db;
  const rows = await sql`update team.member set role_id = ${roleId} where user_id = ${userId} returning 1`;
  return rows.length > 0;
}

export async function setMustChangePassword(userId: string, value: boolean, db: Sql = requireSql()): Promise<void> {
  const sql = db;
  await sql`update team.member set must_change_password = ${value} where user_id = ${userId}`;
}

export async function removeMember(userId: string, db: Sql = requireSql()): Promise<boolean> {
  const sql = db;
  const rows = await sql`delete from team.member where user_id = ${userId} returning 1`;
  return rows.length > 0;
}

/** A member's name, kept with their byline's account name when they change it. */
export async function renameMember(userId: string, name: string): Promise<void> {
  const sql = requireSql();
  await sql`update team.member set name = ${name} where user_id = ${userId}`;
}

/* ---------------------------------------------------------------------------
   Logins (Supabase's tables, read only)
--------------------------------------------------------------------------- */

/** The login for an address, if there is one. */
export async function loginByEmail(
  email: string,
  db: Sql = requireSql(),
): Promise<{ userId: string; partner: boolean; member: boolean } | null> {
  const sql = db;
  const [row] = await sql<{ id: string; partner: boolean; member: boolean }[]>`
    select u.id,
           exists (select 1 from affiliate.partner p where p.user_id = u.id) as partner,
           exists (select 1 from team.member m where m.user_id = u.id) as member
    from auth.users u
    where lower(u.email) = ${email}
    order by u.created_at
    limit 1
  `;
  return row ? { userId: row.id, partner: row.partner, member: row.member } : null;
}

/**
 * Ends every session the login has, everywhere.
 *
 * The one write to `auth` made directly: the auth server's own sign-out needs
 * the person's token, which only they have. Deleting their sessions also
 * revokes the refresh tokens hanging off them, and `getUser()` refuses an
 * access token whose session is gone, so the next request of every signed-in
 * tab lands on the login page.
 */
export async function endSessions(userId: string, db: Sql = requireSql()): Promise<void> {
  const sql = db;
  await sql`delete from auth.sessions where user_id = ${userId}`;
}

/* ---------------------------------------------------------------------------
   Roles
--------------------------------------------------------------------------- */

export async function listRoles(): Promise<RoleSummary[]> {
  const sql = requireSql();
  const rows = await sql<(RoleRecord & { members: number; invites: number })[]>`
    select ${sql.unsafe(ROLE_COLUMNS)},
           (select count(*)::int from team.member m where m.role_id = r.id) as members,
           (select count(*)::int from team.invite i where i.role_id = r.id) as invites
    from team.role r
    order by r.builtin = 'admin' desc nulls last, r.builtin = 'viewer' desc nulls last, lower(r.name)
  `;
  return rows.map((row) => ({ ...toRole(row), members: row.members, invites: row.invites }));
}

/** Saves a role somebody made. The ready-made roles cannot be changed. */
export async function saveRole(
  id: string | null,
  values: { name: string; description: string | null; permissions: Permissions },
  db: Sql = requireSql(),
): Promise<string | null> {
  const sql = db;
  if (id) {
    const [row] = await sql<{ id: string }[]>`
      update team.role
      set name = ${values.name}, description = ${values.description},
          permissions = ${sql.json(values.permissions)}, updated_at = now()
      where id = ${id} and builtin is null
      returning id
    `;
    return row?.id ?? null;
  }
  const [row] = await sql<{ id: string }[]>`
    insert into team.role (name, description, permissions)
    values (${values.name}, ${values.description}, ${sql.json(values.permissions)})
    returning id
  `;
  return row.id;
}

/** Deletes a role nobody holds and no invite offers. */
export async function deleteRole(id: string, db: Sql = requireSql()): Promise<"deleted" | "in-use" | "missing"> {
  const sql = db;
  const [row] = await sql<{ deleted: boolean; in_use: boolean }[]>`
    with target as (
      select r.id,
             exists (select 1 from team.member m where m.role_id = r.id)
             or exists (select 1 from team.invite i where i.role_id = r.id) as in_use
      from team.role r
      where r.id = ${id} and r.builtin is null
    ),
    gone as (
      delete from team.role r using target t
      where r.id = t.id and not t.in_use
      returning r.id
    )
    select exists (select 1 from gone) as deleted, coalesce((select in_use from target), false) as in_use
  `;
  if (row?.deleted) return "deleted";
  return row?.in_use ? "in-use" : "missing";
}

/* ---------------------------------------------------------------------------
   Invites
--------------------------------------------------------------------------- */

export type InviteRow = {
  id: string;
  email: string;
  name: string;
  role: RoleRow;
  invitedBy: string | null;
  createdAt: string;
  expiresAt: string;
};

type InviteRecord = RoleRecord & {
  id: string;
  email: string;
  name: string;
  invited_by: string | null;
  created_at: Date;
  expires_at: Date;
};

function toInvite(row: InviteRecord): InviteRow {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: toRole(row),
    invitedBy: row.invited_by,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
  };
}

export async function listInvites(): Promise<InviteRow[]> {
  const sql = requireSql();
  const rows = await sql<InviteRecord[]>`
    select i.id, i.email, i.name, i.invited_by, i.created_at, i.expires_at, ${sql.unsafe(ROLE_COLUMNS)}
    from team.invite i
    join team.role r on r.id = i.role_id
    order by i.created_at desc
  `;
  return rows.map(toInvite);
}

/** An invite still open under this token, or null. */
export async function inviteByTokenHash(tokenHash: string): Promise<InviteRow | null> {
  const sql = requireSql();
  const [row] = await sql<InviteRecord[]>`
    select i.id, i.email, i.name, i.invited_by, i.created_at, i.expires_at, ${sql.unsafe(ROLE_COLUMNS)}
    from team.invite i
    join team.role r on r.id = i.role_id
    where i.token_hash = ${tokenHash} and i.expires_at > now()
  `;
  return row ? toInvite(row) : null;
}

type NewLink = { tokenHash: string; invitedBy: string; expiresAt: Date };

/**
 * Opens an invite. Null if the address already has one still open: that
 * invite is changed only by resending or cancelling it, which check the
 * role it offers. An expired one is replaced, since its link is dead anyway.
 */
export async function openInvite(invite: NewLink & { email: string; name: string; roleId: string }, db: Sql = requireSql()): Promise<string | null> {
  const sql = db;
  const [row] = await sql<{ id: string }[]>`
    insert into team.invite (email, name, role_id, token_hash, invited_by, expires_at)
    values (${invite.email}, ${invite.name}, ${invite.roleId}, ${invite.tokenHash}, ${invite.invitedBy}, ${invite.expiresAt})
    on conflict (email) do update
      set name = excluded.name, role_id = excluded.role_id, token_hash = excluded.token_hash,
          invited_by = excluded.invited_by, created_at = now(), expires_at = excluded.expires_at
      where team.invite.expires_at <= now()
    returning id
  `;
  return row?.id ?? null;
}

/**
 * A new link for an invite: the old one stops working. Only while it still
 * offers `roleId`, the role the caller checked, so a change in between can't
 * slip past that check.
 */
export async function renewInvite(id: string, roleId: string, link: NewLink, db: Sql = requireSql()): Promise<boolean> {
  const sql = db;
  const rows = await sql`
    update team.invite
    set token_hash = ${link.tokenHash}, invited_by = ${link.invitedBy}, created_at = now(), expires_at = ${link.expiresAt}
    where id = ${id} and role_id = ${roleId}
    returning 1
  `;
  return rows.length > 0;
}

export async function deleteInvite(id: string, db: Sql = requireSql()): Promise<boolean> {
  const sql = db;
  const rows = await sql`delete from team.invite where id = ${id} returning 1`;
  return rows.length > 0;
}

/**
 * Turns an open invite into a membership for this login, once. The invite is
 * locked and deleted in the same transaction, so two tabs accepting at once
 * make one member. Null when the invite is gone, expired, or for another
 * address.
 */
export async function acceptInvite(
  tokenHash: string,
  login: { userId: string; email: string },
): Promise<InviteRow | null> {
  const sql = requireSql();
  /* `transaction`, never `sql.begin()`: see `max_pipeline` in src/lib/db.ts. */
  return transaction(sql, async (tx) => {
    const [row] = await tx<InviteRecord[]>`
      select i.id, i.email, i.name, i.invited_by, i.created_at, i.expires_at, ${tx.unsafe(ROLE_COLUMNS)}
      from team.invite i
      join team.role r on r.id = i.role_id
      where i.token_hash = ${tokenHash} and i.expires_at > now() and i.email = ${login.email}
      for update of i
    `;
    if (!row) return null;
    await tx`
      insert into team.member (user_id, email, name, role_id, added_by)
      values (${login.userId}, ${login.email}, ${row.name}, ${row.role_id}, ${row.invited_by})
      on conflict (user_id) do nothing
    `;
    await tx`delete from team.invite where id = ${row.id}`;
    return toInvite(row);
  });
}

/* ---------------------------------------------------------------------------
   Locks, for checking and changing in one transaction
--------------------------------------------------------------------------- */

/**
 * A member, locked until the transaction ends, with their role locked against
 * edits: a change of role, a removal or an edit of that role elsewhere waits.
 * `email` is the login's address now, not the one recorded when they joined:
 * that is what the Owner check reads, so a member since put on the Owner list
 * is recognised as the Owner.
 */
export async function lockMember(tx: Sql, userId: string): Promise<TeamPerson | null> {
  const [row] = await tx<(PersonRecord & RoleRecord)[]>`
    select m.user_id, lower(u.email) as email, m.name, m.must_change_password, false as two_factor,
           null::timestamptz as last_sign_in_at, ${tx.unsafe(ROLE_COLUMNS)}
    from team.member m
    join team.role r on r.id = m.role_id
    join auth.users u on u.id = m.user_id
    where m.user_id = ${userId}
    for update of m for share of r
  `;
  return row ? toPerson(row, false, toRole(row)) : null;
}

/**
 * The role a member acts with, locked against edits until the transaction
 * ends, together with their membership: what they may do is read again here,
 * after any change to their own access that was in flight has landed. Null if
 * they are no longer on the team.
 */
export async function lockActorRole(tx: Sql, userId: string): Promise<RoleRow | null> {
  const [row] = await tx<RoleRecord[]>`
    select ${tx.unsafe(ROLE_COLUMNS)}
    from team.member m
    join team.role r on r.id = m.role_id
    where m.user_id = ${userId}
    for share of m, r
  `;
  return row ? toRole(row) : null;
}

/** A member's own row, locked while they change their password. False if they're no longer on the team. */
export async function lockOwnMembership(tx: Sql, userId: string): Promise<boolean> {
  const rows = await tx`select 1 from team.member where user_id = ${userId} for update`;
  return rows.length > 0;
}

/** A role, locked: `share` to give it out, `update` to edit or delete it. */
export async function lockRole(tx: Sql, id: string, mode: "share" | "update"): Promise<RoleRow | null> {
  const [row] = await tx<RoleRecord[]>`
    select ${tx.unsafe(ROLE_COLUMNS)} from team.role r where r.id = ${id}
    ${mode === "update" ? tx`for update` : tx`for share`}
  `;
  return row ? toRole(row) : null;
}

/** An invite, locked, with the role it offers locked against edits. */
export async function lockInvite(tx: Sql, id: string): Promise<InviteRow | null> {
  const [row] = await tx<InviteRecord[]>`
    select i.id, i.email, i.name, i.invited_by, i.created_at, i.expires_at, ${tx.unsafe(ROLE_COLUMNS)}
    from team.invite i
    join team.role r on r.id = i.role_id
    where i.id = ${id}
    for update of i for share of r
  `;
  return row ? toInvite(row) : null;
}

/**
 * Holds an address until the transaction ends, for the two ways of adding
 * somebody (an invite, or a login made for them), neither of which has a row
 * to lock yet. Each checks the other under this lock.
 */
export async function lockAddress(tx: Sql, email: string): Promise<void> {
  await tx`select pg_advisory_xact_lock(hashtextextended(${"team-address:" + email}, 0))`;
}

/** Whether the address has an invite that can still be used. */
export async function hasOpenInvite(db: Sql, email: string): Promise<boolean> {
  const [row] = await db<{ open: boolean }[]>`
    select exists (select 1 from team.invite where email = ${email} and expires_at > now()) as open
  `;
  return row.open;
}

/* ---------------------------------------------------------------------------
   Activity
--------------------------------------------------------------------------- */

export type ActivityRow = { id: string; at: string; actorEmail: string; actorName: string; action: string };

export async function recordActivity(
  actor: { email: string; name: string },
  action: string,
  db: Sql = requireSql(),
): Promise<void> {
  const sql = db;
  await sql`
    insert into team.activity (actor_email, actor_name, action)
    values (${actor.email}, ${actor.name.slice(0, 100)}, ${action.slice(0, 500)})
  `;
}

export async function listActivity(limit = 200): Promise<ActivityRow[]> {
  const sql = requireSql();
  const rows = await sql<{ id: string; at: Date; actor_email: string; actor_name: string; action: string }[]>`
    select id::text, at, actor_email, actor_name, action
    from team.activity
    order by at desc, id desc
    limit ${limit}
  `;
  return rows.map((row) => ({
    id: row.id,
    at: row.at.toISOString(),
    actorEmail: row.actor_email,
    actorName: row.actor_name,
    action: row.action,
  }));
}
