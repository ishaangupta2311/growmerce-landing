-- Storage for the "Try it free" flow: one cached preview per storefront, and
-- every email that ever asked about one.
--
-- Kept in its own `marketing` schema rather than `public` so that if this
-- database is ever shared with the Shopify app, the two cannot collide on a
-- table name.

create schema if not exists marketing;

-- One row per storefront. `result` is the whole PreviewResult, screenshots
-- included, because the point of this table is that a second visitor asking
-- about the same shop never pays for the browser launch again.
--
-- Rows run ~250 KB with two base64 captures in them. That is deliberate for
-- now: at 500 KB of headroom per free-tier megabyte it holds roughly 2,000
-- storefronts, which is far more than this funnel will see. If it ever gets
-- close, the move is JPEGs into Supabase Storage and metadata here, dropping a
-- row to ~2 KB.
create table if not exists marketing.preview (
  domain      text primary key,
  result      jsonb       not null,
  -- Set when the capture came back without a screenshot or with default
  -- colours. Those expire far sooner: a placeholder pinned for a week would
  -- strand a store that happened to be behind a challenge page that day.
  degraded    boolean     not null default false,
  fetched_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists preview_fetched_at_idx on marketing.preview (fetched_at);

-- One row per (storefront, email). The unique constraint is the feature: a
-- returning visitor re-entering the same address is a no-op, while a second
-- person from the same shop is appended rather than overwriting the first.
--
-- `domain` is nullable because the "See demo" gate takes an email with no
-- store attached. NULLS NOT DISTINCT is load-bearing there — Postgres treats
-- NULLs as distinct in a unique index by default, so without it every repeat
-- submission through that gate would insert another row.
create table if not exists marketing.lead (
  id          bigint generated always as identity primary key,
  domain      text,
  email       text        not null,
  source      text        not null,
  created_at  timestamptz not null default now(),
  constraint lead_domain_email_key unique nulls not distinct (domain, email)
);

create index if not exists lead_domain_idx on marketing.lead (domain);
create index if not exists lead_created_at_idx on marketing.lead (created_at desc);
