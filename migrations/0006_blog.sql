-- The blog and the admin panel that edits it.
--
-- Its own `blog` schema for the same reason `marketing` has one: if this
-- database is ever shared with the Shopify app, `post`, `tag` and `session`
-- are names both systems would otherwise want. Supabase's Data API only
-- exposes `public` by default, so nothing here is reachable through it — every
-- read and write goes through the server with the service connection.
--
-- Idempotent like the migrations before it: every statement is guarded, so
-- `npm run db:migrate` can re-run the whole folder safely.

create schema if not exists blog;

-- Admin accounts. Passwords are bcrypt hashes only; the plain text never
-- reaches this table. `email` is stored lower-cased so the unique constraint
-- means what a person expects it to mean.
create table if not exists blog.admin_user (
  id             bigint generated always as identity primary key,
  email          text        not null,
  name           text        not null default '',
  password_hash  text        not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_login_at  timestamptz,
  constraint admin_user_email_key unique (email),
  constraint admin_user_email_lower check (email = lower(email))
);

-- Server-side sessions. `id` is the SHA-256 of the random token in the cookie,
-- so a leaked copy of this table cannot be replayed as a login. Logging out
-- deletes the row, which is what makes a stolen cookie worthless afterwards.
create table if not exists blog.session (
  id             text        primary key,
  admin_user_id  bigint      not null references blog.admin_user (id) on delete cascade,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  user_agent     text
);

create index if not exists session_admin_user_idx on blog.session (admin_user_id);
create index if not exists session_expires_at_idx on blog.session (expires_at);

-- Login throttling that holds across serverless instances, which the
-- in-memory budgets in src/lib/preview/rate-limit.ts cannot. Both keys are
-- hashes: this table answers "how many recent failures", not "who".
create table if not exists blog.login_attempt (
  id          bigint generated always as identity primary key,
  ip_hash     text        not null,
  email_hash  text        not null,
  succeeded   boolean     not null,
  created_at  timestamptz not null default now()
);

create index if not exists login_attempt_ip_idx on blog.login_attempt (ip_hash, created_at desc);
create index if not exists login_attempt_email_idx on blog.login_attempt (email_hash, created_at desc);

-- The byline on a post. Separate from `admin_user` because a guest author
-- needs a byline without needing a login; an admin can be linked to one.
create table if not exists blog.author (
  id             bigint generated always as identity primary key,
  name           text        not null,
  slug           text        not null,
  bio            text,
  avatar_url     text,
  admin_user_id  bigint      references blog.admin_user (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint author_slug_key unique (slug),
  constraint author_admin_user_key unique (admin_user_id)
);

create table if not exists blog.category (
  id           bigint generated always as identity primary key,
  name         text        not null,
  slug         text        not null,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint category_slug_key unique (slug)
);

create table if not exists blog.tag (
  id          bigint generated always as identity primary key,
  name        text        not null,
  slug        text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint tag_slug_key unique (slug)
);

-- Uploaded images, bytes included. The site deploys to serverless functions
-- with a read-only filesystem, so the database is the one durable store we
-- already run. Every upload is re-encoded to WebP and capped in size before it
-- lands here, which keeps rows small; the public route serves them with an
-- immutable cache header, so the CDN — not Postgres — answers repeat views.
-- A uuid key keeps images uploaded for an unpublished draft unguessable.
create table if not exists blog.media (
  id           uuid        primary key default gen_random_uuid(),
  filename     text        not null,
  mime_type    text        not null,
  width        integer     not null,
  height       integer     not null,
  size_bytes   integer     not null,
  alt_text     text,
  data         bytea       not null,
  uploaded_by  bigint      references blog.admin_user (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists media_created_at_idx on blog.media (created_at desc);

-- One row per post. A scheduled post carries its go-live moment in both
-- `scheduled_at` and `published_at`, so "is this live" is one rule everywhere:
-- status is published or scheduled, and published_at has passed. That is what
-- lets a scheduled post appear on time without a cron job.
create table if not exists blog.post (
  id               bigint generated always as identity primary key,
  title            text        not null,
  slug             text        not null,
  excerpt          text,
  -- Sanitised HTML from the editor. Sanitised again on render.
  content          text        not null default '',
  featured_image   text,
  og_image         text,
  twitter_card     text        not null default 'summary_large_image',
  author_id        bigint      references blog.author (id) on delete set null,
  category_id      bigint      references blog.category (id) on delete set null,
  status           text        not null default 'draft',
  published_at     timestamptz,
  scheduled_at     timestamptz,
  seo_title        text,
  seo_description  text,
  seo_keywords     text,
  canonical_url    text,
  created_by       bigint      references blog.admin_user (id) on delete set null,
  updated_by       bigint      references blog.admin_user (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint post_slug_key unique (slug),
  constraint post_status_check check (status in ('draft', 'scheduled', 'published')),
  constraint post_twitter_card_check check (twitter_card in ('summary', 'summary_large_image')),
  constraint post_published_has_date check (status <> 'published' or published_at is not null),
  constraint post_scheduled_has_date check (status <> 'scheduled' or scheduled_at is not null)
);

create index if not exists post_live_idx on blog.post (status, published_at desc);
create index if not exists post_updated_at_idx on blog.post (updated_at desc);
create index if not exists post_category_idx on blog.post (category_id);
create index if not exists post_author_idx on blog.post (author_id);

create table if not exists blog.post_tag (
  post_id  bigint not null references blog.post (id) on delete cascade,
  tag_id   bigint not null references blog.tag (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists post_tag_tag_idx on blog.post_tag (tag_id);

-- Snapshots behind the editor's Preview button. Previewing unsaved edits to a
-- live post must not touch the live post, so the editor's current state is
-- written here instead and rendered from a URL only a signed-in admin can
-- open. Rows older than a day are swept whenever a new one is written.
create table if not exists blog.post_preview (
  id          uuid        primary key default gen_random_uuid(),
  post_id     bigint      references blog.post (id) on delete cascade,
  data        jsonb       not null,
  created_by  bigint      references blog.admin_user (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists post_preview_created_at_idx on blog.post_preview (created_at);
