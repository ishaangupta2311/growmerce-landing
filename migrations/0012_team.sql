-- The team: who may sign in to /admin, and what each person may see and do.
--
-- Until now the admin was everyone on AFFILIATE_ADMIN_EMAILS, all with every
-- power. That list stays, but only for the Owner: the people who can never be
-- locked out or demoted from inside the app (see src/lib/admin/session.ts).
-- Everyone else is a row in `team.member`, holding one role.
--
-- A role is a name and a grid of permissions, one per admin tab (and one per
-- app under Your apps): `{"blog.posts": "edit", "email": "view"}`. A tab that
-- is not in the grid is not visible. The two ready-made roles are marked by
-- `builtin` and ignore the grid: Admin can edit everything and Viewer can view
-- everything, including tabs and apps added after the role was made. The
-- tabs themselves are defined in code (src/lib/team/permissions.ts).
--
-- Logins are Supabase's (`auth.users`); a member row is what turns one into
-- a teammate, so removing the row takes the admin away at once while leaving
-- the login (which may also be a partner's) alone.
--
-- Invites hold a hash of their token, never the token: the link in the email
-- is the only copy.
--
-- RLS on, no policies, like every other schema here: only the server's own
-- connection reads these. Re-runnable.

create schema if not exists team;

create table if not exists team.role (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(btrim(name)) between 1 and 40),
  description  text check (description is null or length(description) <= 200),
  -- 'admin' or 'viewer' for the two ready-made roles, null for the rest.
  builtin      text unique check (builtin in ('admin', 'viewer')),
  permissions  jsonb not null default '{}'::jsonb
               check (jsonb_typeof(permissions) = 'object'
                      and not jsonb_path_exists(permissions, '$.* ? (@ != "view" && @ != "edit")')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists role_name_key on team.role (lower(btrim(name)));

insert into team.role (name, description, builtin)
values
  ('Admin', 'Can see and change everything, including the team.', 'admin'),
  ('Viewer', 'Can see everything, and change nothing.', 'viewer')
on conflict (builtin) do nothing;

create table if not exists team.member (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  email                 text not null unique check (email = lower(email)),
  name                  text not null check (length(btrim(name)) between 1 and 100),
  role_id               uuid not null references team.role (id) on delete restrict,
  -- Set when somebody else chose their password (a login created for them, or
  -- a reset): the admin asks for a new one before anything else.
  must_change_password  boolean not null default false,
  added_by              text,
  created_at            timestamptz not null default now()
);

create index if not exists member_role_idx on team.member (role_id);

create table if not exists team.invite (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (email = lower(email)),
  name        text not null check (length(btrim(name)) between 1 and 100),
  role_id     uuid not null references team.role (id) on delete cascade,
  token_hash  text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by  text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

-- Who changed what, newest first. Names are copied in rather than joined, so
-- an entry still reads right after its author has left the team.
create table if not exists team.activity (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor_email  text not null,
  actor_name   text not null,
  action       text not null check (length(action) between 1 and 500)
);

create index if not exists activity_at_idx on team.activity (at desc);

-- A login is a teammate or a partner, never both: the admin approves partners
-- and sets their rates, so one person holding both could pay themselves. The
-- app checks before adding either, but two requests racing each other (an
-- application and an invite accepted at the same moment) could both pass, so
-- the database has the final word. Both inserts take the same per-login lock
-- before looking at the other table, so whichever commits second sees the
-- first and is refused.
create or replace function team.keep_partners_off_the_team() returns trigger
language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('team-or-partner:' || new.user_id::text, 0));
  if tg_table_schema = 'team' then
    if exists (select 1 from affiliate.partner p where p.user_id = new.user_id) then
      raise exception 'this login is an affiliate partner'
        using errcode = 'check_violation', constraint = 'member_not_partner';
    end if;
  elsif exists (select 1 from team.member m where m.user_id = new.user_id) then
    raise exception 'this login is on the admin team'
      using errcode = 'check_violation', constraint = 'partner_not_member';
  end if;
  return new;
end;
$$;

drop trigger if exists member_not_partner on team.member;
create trigger member_not_partner
  before insert or update of user_id on team.member
  for each row execute function team.keep_partners_off_the_team();

drop trigger if exists partner_not_member on affiliate.partner;
create trigger partner_not_member
  before insert or update of user_id on affiliate.partner
  for each row execute function team.keep_partners_off_the_team();

alter table team.role enable row level security;
alter table team.member enable row level security;
alter table team.invite enable row level security;
alter table team.activity enable row level security;
