-- The install waitlist: everyone who pressed "Install on Shopify" while the
-- listing was still in review.
--
-- This is deliberately *not* `marketing.lead`. A lead is someone who asked to
-- see something; a row here is a promise we made — the button they pressed
-- said install, and we owe them the install link the day the listing clears
-- review. That obligation is what `notified_at` records, and it is the reason
-- this needs its own table rather than another `source` value on `lead`:
-- "who have we not written to yet" has to be a column, not a guess.
--
-- Same `marketing` schema as `lead` and `preview`, for the same reason — if
-- this database is ever shared with the Shopify app, `waitlist` is a name both
-- systems would otherwise want.

create schema if not exists marketing;

-- One row per (storefront, email), matching the rule the owner set for leads:
-- the same person coming back is a no-op, a colleague from the same shop is
-- appended, and the same person's second shop is appended too. The dedup is
-- the table's job, not the application's — `src/lib/waitlist.ts` inserts with
-- ON CONFLICT DO NOTHING, so two clicks racing each other cannot both land and
-- there is no read-then-write to get wrong.
--
-- `domain` is `not null` here even though `lead.domain` is nullable, so this
-- table needs no NULLS NOT DISTINCT: the form behind this row always asks for
-- the store, because a waitlist entry we cannot tie to a storefront is one we
-- cannot act on when the listing goes live.
create table if not exists marketing.waitlist (
  id           bigint generated always as identity primary key,
  domain       text        not null,
  email        text        not null,
  -- Optional, and asked for last. It makes the eventual email a letter rather
  -- than a broadcast, but nobody should lose their place for skipping it.
  name         text,
  -- Which CTA sent them — the pricing page and the /try preview are different
  -- states of mind, and the launch email can read differently for each.
  source       text        not null,
  created_at   timestamptz not null default now(),
  -- Set when the "we're live" email goes out. Null means still owed one; this
  -- is the whole point of the table.
  notified_at  timestamptz,
  constraint waitlist_domain_email_key unique (domain, email)
);

create index if not exists waitlist_created_at_idx on marketing.waitlist (created_at desc);

-- The launch job's query is "everyone we still owe an email", oldest first.
-- Partial, because once the backlog is cleared this index stays empty and free.
create index if not exists waitlist_pending_idx
  on marketing.waitlist (created_at)
  where notified_at is null;
