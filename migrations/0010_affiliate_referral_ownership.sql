-- A store no longer belongs to its first code for ever.
--
-- 0002 made `affiliate.referral.shop` unique across the whole table, which is
-- what "first code wins, permanently" meant in practice. The rule is now:
--
--   - A referral lasts while the store stays subscribed. A cancellation or an
--     uninstall ends it, and a later resubscription does not bring it back.
--   - A store that returns has no referral, and may be linked again by any
--     code.
--   - A subscribed store may replace its code with another partner's. Charges
--     from then on earn for the new partner; earlier ones stay where they were.
--
-- So a store can have several referral rows over time, and at most one that is
-- live. `ended_at` is what tells them apart, and the partial unique index below
-- is what makes "at most one live" true rather than a race between two ingest
-- requests.
--
-- Re-runnable, like every migration here.

alter table affiliate.referral add column if not exists ended_at timestamptz;

-- Whether the store had already paid somebody a commission when this referral
-- took it over from another partner. An influencer earns once per store, for
-- the introduction; a store that switches to an influencer's code mid-
-- subscription was not introduced by them, and without this a merchant could
-- hand a different influencer 30% of every month by retyping a field.
alter table affiliate.referral
  add column if not exists first_payment_taken boolean not null default false;

-- Rows cancelled under the old rule were revivable; they are ended now.
update affiliate.referral
   set ended_at = coalesce(cancelled_at, last_event_at)
 where status = 'cancelled' and ended_at is null;

alter table affiliate.referral drop constraint if exists referral_status_check;
alter table affiliate.referral add constraint referral_status_check
  check (status in ('linked', 'trialing', 'active', 'cancelled', 'replaced'));

-- Ended and "cancelled or replaced" are the same fact stated twice. Keeping
-- them from disagreeing is what lets every query ask whichever is convenient.
alter table affiliate.referral drop constraint if exists referral_ended_matches_status;
alter table affiliate.referral add constraint referral_ended_matches_status
  check ((ended_at is not null) = (status in ('cancelled', 'replaced')));

alter table affiliate.referral drop constraint if exists referral_shop_key;
create unique index if not exists referral_live_shop_key
  on affiliate.referral (shop) where ended_at is null;
create index if not exists referral_shop_idx on affiliate.referral (shop, linked_at);

-- Which referral a charge on `shop` at moment `at` belongs to: the one most
-- recently linked by then. A charge stamped before the store's first referral
-- — a sender's clock, or a charge reported late — goes to that first referral
-- rather than to nobody, which is what a single row per store used to give.
--
-- Whether that referral had *ended* by `at` is a separate question, asked by
-- the caller; this only answers whose it was.
create or replace function affiliate.referral_at(target_shop text, at timestamptz)
returns bigint
language sql
stable
as $$
  select id
    from affiliate.referral
   where shop = target_shop
   order by (linked_at <= at) desc,
            case when linked_at <= at then linked_at end desc nulls last,
            linked_at asc,
            id asc
   limit 1
$$;
