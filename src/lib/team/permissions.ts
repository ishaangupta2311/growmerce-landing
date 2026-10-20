/**
 * What a teammate may see and do in the admin: one permission per tab, each
 * none, view or edit.
 *
 * Pure and client-safe. The server decides with `allows` (see
 * `requireAccess` in src/lib/admin/session.ts); the sidebar and the buttons
 * use the same function only to hide what would be refused anyway.
 *
 * The tabs are defined here, in code, because each one is a page and its
 * actions: a tab only exists once the code that checks it does. Your apps is
 * the exception, with one permission per app (`app:<id>`), because apps are
 * rows in the database.
 */

export type Level = "view" | "edit";

/** Tab key → level. A tab that is not here is not visible. */
export type Permissions = Record<string, Level>;

/**
 * What one person holds. `all` is for the Owner and the two ready-made roles:
 * a level on every tab, including tabs and apps added later. Otherwise
 * `permissions` lists them one by one.
 */
export type Grant = { all: Level | null; permissions: Permissions };

export type Tab = {
  key: string;
  label: string;
  /** What the permission covers, shown in the role editor. */
  hint?: string;
  /** Some tabs only show things: Overview has nothing to edit. */
  levels: readonly Level[];
};

export type Section = { label: string; tabs: Tab[] };

const VIEW_ONLY = ["view"] as const;
const VIEW_EDIT = ["view", "edit"] as const;

export const APP_SETTINGS = "apps.settings";

export function appKey(appId: string): string {
  return `app:${appId}`;
}

/**
 * Every tab, grouped the way the sidebar groups them. Your apps needs the app
 * list, so it is built per request.
 */
export function sections(apps: readonly { id: string; name: string }[]): Section[] {
  return [
    {
      label: "Overview",
      tabs: [
        {
          key: "overview",
          label: "Overview",
          hint: "the front page's figures, for the tabs they can see",
          levels: VIEW_ONLY,
        },
      ],
    },
    {
      label: "Your apps",
      tabs: [
        ...apps.map((app) => ({
          key: appKey(app.id),
          label: app.name,
          hint: "its stores and their dashboards; edit stars stores",
          levels: VIEW_EDIT,
        })),
        { key: APP_SETTINGS, label: "App settings", hint: "add, change and remove apps", levels: VIEW_EDIT },
      ],
    },
    {
      label: "Blog",
      tabs: [
        { key: "blog.posts", label: "Posts", levels: VIEW_EDIT },
        { key: "blog.categories", label: "Categories", levels: VIEW_EDIT },
        { key: "blog.tags", label: "Tags", levels: VIEW_EDIT },
        { key: "blog.media", label: "Media", levels: VIEW_EDIT },
        { key: "blog.authors", label: "Authors", hint: "the bylines on posts", levels: VIEW_EDIT },
      ],
    },
    {
      label: "Affiliates",
      tabs: [
        { key: "affiliates.overview", label: "Overview", levels: VIEW_ONLY },
        {
          key: "affiliates.partners",
          label: "Partners",
          hint: "edit approves partners, sets rates and replays held charges",
          levels: VIEW_EDIT,
        },
        { key: "affiliates.payouts", label: "Payouts", hint: "edit records payouts", levels: VIEW_EDIT },
        { key: "affiliates.events", label: "Ingest log", levels: VIEW_ONLY },
      ],
    },
    { label: "Merchants", tabs: [{ key: "email", label: "Email", hint: "edit sends campaigns", levels: VIEW_EDIT }] },
    {
      label: "Team",
      tabs: [
        { key: "team", label: "Team", hint: "edit adds people, changes roles and edits roles", levels: VIEW_EDIT },
      ],
    },
  ];
}

export const NO_ACCESS: Grant = { all: null, permissions: {} };

/** What a role lets its holders do. The ready-made roles cover every tab, including later ones. */
export function grantOf(role: { builtin: "admin" | "viewer" | null; permissions: Permissions }): Grant {
  if (role.builtin === "admin") return { all: "edit", permissions: {} };
  if (role.builtin === "viewer") return { all: "view", permissions: {} };
  return { all: null, permissions: role.permissions };
}

/** Whether somebody holding `granter` may give out, make or edit `role`. */
export function canAssign(
  granter: Grant,
  role: { builtin: "admin" | "viewer" | null; permissions: Permissions },
): boolean {
  return covers(granter, grantOf(role));
}

/**
 * Whether `actor` may change or remove `person`: never an Owner, never
 * themselves, and only somebody whose role their own access covers.
 */
export function canManage(
  actor: { userId: string; grant: Grant },
  person: {
    userId: string | null;
    owner: boolean;
    role: { builtin: "admin" | "viewer" | null; permissions: Permissions } | null;
  },
): boolean {
  if (person.owner || !person.role || !person.userId || person.userId === actor.userId) return false;
  return canAssign(actor.grant, person.role);
}

/** Whether the grant reaches `level` on the tab `key`. Edit includes view. */
export function allows(grant: Grant, key: string, level: Level = "view"): boolean {
  const held = grant.all ?? grant.permissions[key];
  if (!held) return false;
  return level === "view" || held === "edit";
}

/** Whether any tab starting with `prefix` is visible: the sidebar's test for a section. */
export function allowsAny(grant: Grant, prefix: string): boolean {
  if (grant.all) return true;
  return Object.keys(grant.permissions).some((key) => key.startsWith(prefix));
}

/**
 * The first page this person can open, in sidebar order: where "/admin" sends
 * somebody whose role leaves out the Overview, rather than to a 404 straight
 * after signing in. My account is open to everybody, so there always is one.
 */
export function homeFor(grant: Grant): string {
  const pages: [boolean, string][] = [
    [allows(grant, "overview"), "/admin"],
    [allowsApps(grant), "/admin/apps"],
    [allows(grant, "blog.posts"), "/admin/blog"],
    [allows(grant, "blog.categories"), "/admin/blog/categories"],
    [allows(grant, "blog.tags"), "/admin/blog/tags"],
    [allows(grant, "blog.media"), "/admin/blog/media"],
    [allows(grant, "blog.authors"), "/admin/blog/settings"],
    [allows(grant, "affiliates.overview"), "/admin/affiliates"],
    [allows(grant, "affiliates.partners"), "/admin/affiliates/partners"],
    [allows(grant, "affiliates.payouts"), "/admin/affiliates/payouts"],
    [allows(grant, "affiliates.events"), "/admin/affiliates/events"],
    [allows(grant, "email"), "/admin/email"],
    [allows(grant, "team"), "/admin/team"],
  ];
  return pages.find(([open]) => open)?.[1] ?? "/admin/account";
}

/** Whether any app, or app settings, is visible: the test for the Your apps tab. */
export function allowsApps(grant: Grant): boolean {
  return allowsAny(grant, "app:") || allows(grant, APP_SETTINGS);
}

/**
 * Whether `granter` already holds everything in `grant`. Nobody hands out what
 * they do not have: a teammate who manages the team can invite people, change
 * roles and edit roles, but only up to their own access. Otherwise one person
 * with Team edit could give themselves the rest of the admin.
 *
 * A grant with `all` covers tabs that do not exist yet, so only an `all` at
 * least as high covers it.
 */
export function covers(granter: Grant, grant: Grant): boolean {
  if (granter.all === "edit") return true;
  if (grant.all) return granter.all === "view" && grant.all === "view";
  return Object.entries(grant.permissions).every(([key, level]) => allows(granter, key, level));
}

/**
 * A permissions object fit to store: only real tabs, each at a level that tab
 * has. Anything else in `raw` is dropped, not refused, so a role editor open
 * while an app was removed still saves.
 */
export function cleanPermissions(raw: unknown, tabs: readonly Tab[]): Permissions {
  const clean: Permissions = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return clean;
  for (const tab of tabs) {
    const level = (raw as Record<string, unknown>)[tab.key];
    if (level === "edit" && tab.levels.includes("edit")) clean[tab.key] = "edit";
    else if (level === "view" || level === "edit") clean[tab.key] = "view";
  }
  return clean;
}
