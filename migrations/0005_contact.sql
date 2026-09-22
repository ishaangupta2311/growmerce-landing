-- Contact form submissions from the public Growmerce site.
--
-- The store URL is nullable by design: the form accepts messages from people
-- who are not ready to share a storefront yet.

create schema if not exists marketing;

create table if not exists marketing.contact_submission (
  id           bigint generated always as identity primary key,
  name         text        not null,
  email        text        not null,
  store        text,
  topic        text        not null,
  message      text        not null,
  created_at   timestamptz not null default now()
);

create index if not exists contact_submission_created_at_idx
  on marketing.contact_submission (created_at desc);
