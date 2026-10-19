-- Your apps: the apps Growmerce has built, and the merchant stores staff keep
-- an eye on in each.
--
-- An app here is a connection, not code. Each app answers the same two
-- requests (its store list, and a read-only dashboard for one store; see
-- src/lib/apps/connection.ts), so adding the next Shopify or WooCommerce app
-- is a row, not a release. What differs per app is where it runs and which
-- shared secret it signs with.
--
-- The secret itself is never stored. `secret_env` names the environment
-- variable that holds it, and the name must end in `_ANALYTICS_SECRET`: a
-- row cannot point the admin at DATABASE_URL or another feature's secret,
-- even though the admin only ever uses it to sign.
--
-- Re-runnable, like every migration here.

create schema if not exists apps;

create table if not exists apps.app (
  -- The address segment, /admin/apps/<id>. Fixed once created.
  id          text primary key
              check (id ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  name        text not null check (length(name) between 1 and 60),
  platforms   text[] not null
              check (cardinality(platforms) > 0
                     and platforms <@ array['shopify', 'woocommerce']::text[]),
  -- Where the app runs. Plain http only for a local test copy of an app.
  base_url    text not null
              check (base_url ~ '^https://[^/?#\s]+$'
                     or base_url ~ '^http://(localhost|127\.0\.0\.1)(:[0-9]+)?$'),
  secret_env  text not null
              check (secret_env ~ '^[A-Z][A-Z0-9_]{0,40}_ANALYTICS_SECRET$'),
  -- A site path ("/brand/x.svg") or an https URL. Null draws the initial.
  icon_url    text check (icon_url ~ '^(/[^/]|https://)'),
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Stores an admin starred, pinned to the top of the app's store list. Keyed
-- by the app's own store id ("shopify:<shop>"), so a store that uninstalls and
-- returns keeps its star.
create table if not exists apps.starred_store (
  app_id      text not null references apps.app (id) on delete cascade,
  store_id    text not null check (length(store_id) between 1 and 300),
  starred_by  text not null,
  starred_at  timestamptz not null default now(),
  primary key (app_id, store_id)
);

-- Growsearch, the first app. Its secret is PORTAL_ANALYTICS_SECRET on the
-- Growsearch service (docs/admin-portal-stores.md in that repo).
insert into apps.app (id, name, platforms, base_url, secret_env, icon_url, position)
values (
  'growsearch',
  'Growsearch',
  array['shopify', 'woocommerce'],
  'https://smart-search-gsog.onrender.com',
  'GROWSEARCH_ANALYTICS_SECRET',
  '/brand/growsearch-mark.svg',
  0
)
on conflict (id) do nothing;

-- Second lock, as in 0002: the admin reads these as `postgres` (BYPASSRLS);
-- RLS with no policies keeps them out of reach if the schema is ever exposed
-- through PostgREST.
alter table apps.app           enable row level security;
alter table apps.starred_store enable row level security;
