# The admin team

Who can sign in to `/admin`, and what each person can see and change there.
Managed on the admin's **Team** tab; stored in the `team` schema
(`migrations/0012_team.sql`).

## Who is on the team

- **The Owner**: every address in `AFFILIATE_ADMIN_EMAILS`. Every permission,
  always, and nothing in the app can change or remove them. That one stays an
  environment variable on purpose: no bug, injection or careless UPDATE can
  lock the Owner out or make somebody else one.
- **Members**: a row in `team.member` each, holding one role. Removing the row
  or changing the role applies on the person's next request.

Everybody signs in with a Supabase login on `/affiliates/login`, the same page
partners use. A teammate is never a partner: the Team page refuses a partner's
login, and the partner pages send teammates to `/admin`.

## Roles

A role is a name and one permission per admin tab: none, view or edit.

| Section | Tabs |
| --- | --- |
| Overview | Overview (view only) |
| Your apps | one per app, plus App settings |
| Blog | Posts, Categories, Tags, Media, Authors |
| Affiliates | Overview and Ingest log (view only), Partners, Payouts |
| Merchants | Email |
| Team | Team |

None hides the tab: it's not in the sidebar, and its address is a 404. View
shows it with every button that changes something hidden. Edit allows the
changes, and every Server Action checks again (`adminAction` in
`src/lib/blog/action-guard.ts`), so a hidden button called by hand is refused.

Two roles are ready-made and can't be edited: **Admin** (edit everything) and
**Viewer** (view everything). Both cover tabs and apps added later. A role you
make covers only the tabs you tick, so a new app starts hidden from it.

The tabs live in code, in `src/lib/team/permissions.ts`. A new admin tab needs
an entry there, a `requireAccess` on its pages and a `need` on its actions.

## Nobody hands out more than they hold

Team → Edit lets somebody add people, change roles and edit roles, but only
up to their own access. They can only give, make or edit a role their own
access covers, and only change people whose role it covers. Nobody changes
their own role, and nobody can touch the Owner. Otherwise one person with Team
→ Edit could give themselves the rest of the admin.

## Adding somebody

- **Email them an invite.** A link that works once, for seven days. The
  database holds a hash of its token, never the token. Opening it, they choose
  a password (or sign in with the login they already have) and land in the
  admin. A resend makes a new link and kills the old one. If the email can't be
  sent, the admin shows the link to pass on by hand.
- **Create their login now.** A temporary password, shown once to whoever made
  it. They must choose their own the first time they sign in.

The ⋯ menu on a person: change role, reset password (a new temporary one, and
they're signed out everywhere), sign out everywhere, turn off a lost two-step
login, and remove from the team.

## Two-step login

Optional, per person, under **My account**: an authenticator-app code (Supabase
TOTP). Once it is on, `requireAdmin` asks for a session at `aal2` and sends
anything less to `/admin/verify` for the code. The factors are read from the
auth server's answer, not the cookie, so a session can't hide them.

## Activity

Team → Activity lists every change made in the admin: who, when and what. Each
action writes its own line (`noteActivity`). Names are copied in, so a line
still reads right after its author has left.

## Setting it up

- `AFFILIATE_ADMIN_EMAILS`: the Owner.
- `SUPABASE_SECRET_KEY`: Supabase's secret key, for creating logins and
  resetting passwords and two-step logins. Without it, invites still work for
  people who already have a login.
- `RESEND_API_KEY` and `EMAIL_FROM` send the invites (see `affiliate.md`).
- Run `npm run db:migrate` for `0012_team.sql`.
