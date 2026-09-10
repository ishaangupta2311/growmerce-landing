-- The affiliate program: who refers stores to us, which stores they referred,
-- what that earned them, and what we have paid out.
--
-- Its own schema for the same reason `marketing` has one — this database may
-- end up shared with the Shopify app, and `partner`, `code` and `event` are
-- names two systems would otherwise both want.
--
-- Two kinds of affiliate, and the difference between them is the whole point
-- of the ledger:
--
--   agency      a web-dev shop that installs Growsearch for its clients. Earns
--               on *every* charge the referred store pays, for as long as that
--               store stays subscribed. The relationship is ongoing, so the
--               commission is too.
--   influencer  earns once, on the first qualifying charge from a store they
--               brought. They made one introduction; they are paid for one
--               introduction.
--
-- Nothing in the schema hard-codes that rule — it lives in
-- `src/lib/affiliate/commission.ts`, which is where it can be read and tested.
-- What the schema does is make the rule *enforceable*: see the partial unique
-- index on `commission` at the bottom, which makes a second one-time
-- commission for the same referral impossible even if the code above it is
-- wrong.

create schema if not exists affiliate;

-- ---------------------------------------------------------------------------
-- Partners
-- ---------------------------------------------------------------------------

-- One row per affiliate account, keyed to the Supabase Auth user that logs in
-- as it. The FK to `auth.users` is what makes "logged in" and "is a partner"
-- the same question; on delete cascade because an affiliate who deletes their
-- login has no way back into this row and it would otherwise be an orphan
-- holding their payout details.
--
-- `kind` is set at sign-up and is not a preference — it decides how the person
-- is paid. Changing it later is an admin act with money attached, which is why
-- there is no UI for it.
create table if not exists affiliate.partner (
  id                bigint generated always as identity primary key,
  user_id           uuid        not null unique references auth.users (id) on delete cascade,
  kind              text        not null check (kind in ('agency', 'influencer')),

  -- What we call them in the dashboard and on a payout. `company` is the
  -- agency name, or the creator's channel. Made `not null` in 0003 — this
  -- column is still declared nullable here so that re-running this file
  -- against an existing database stays a no-op.
  name              text        not null,
  company           text,
  email             text        not null,
  website           text,

  -- `pending` until a human approves the application. A pending partner can
  -- log in and see their code, because they need it to start work, but nothing
  -- clears to `approved` while they are in this state — see
  -- `src/lib/affiliate/commission.ts`.
  status            text        not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected', 'suspended')),

  -- Basis points, so 2000 = 20%. Integers because a percentage stored as a
  -- float is a rounding argument waiting to happen, and this number multiplies
  -- money. Seeded from the defaults in commission.ts at sign-up and kept per
  -- partner so a negotiated rate is a row edit rather than a deploy.
  commission_rate_bps integer   not null check (commission_rate_bps between 0 and 10000),

  -- How they want to be paid, as free text plus a method, because this build
  -- pays by hand. When a payments integration lands it gets its own columns
  -- and this becomes the fallback for the people already onboarded.
  payout_method     text        check (payout_method in ('bank', 'paypal', 'wise', 'other')),
  payout_details    text,
  payout_currency   text        not null default 'USD',

  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists partner_status_idx on affiliate.partner (status);

-- ---------------------------------------------------------------------------
-- Codes
-- ---------------------------------------------------------------------------

-- The string an agency types into the Growsearch app on behalf of a client, or
-- an influencer puts in a video description. A partner gets one at sign-up and
-- may hold several, so a campaign can be told apart from a house code without
-- splitting the account.
--
-- `code` is stored upper-case and is compared as stored; `normaliseCode` in
-- src/lib/affiliate/codes.ts is the only thing allowed to produce one, so a
-- shopper typing `growth-20` and an agency pasting `GROWTH-20` land on the
-- same row.
create table if not exists affiliate.code (
  id          bigint generated always as identity primary key,
  partner_id  bigint      not null references affiliate.partner (id) on delete cascade,
  code        text        not null unique,
  label       text,
  -- Retired rather than deleted: a code that has referrals hanging off it must
  -- keep resolving, or their commissions lose their provenance.
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists code_partner_idx on affiliate.code (partner_id);

-- ---------------------------------------------------------------------------
-- Referrals
-- ---------------------------------------------------------------------------

-- One row per store attributed to a partner: the "websites where they've
-- entered their affiliate code" the dashboard lists.
--
-- `shop` is unique across the whole table, not per partner. A store belongs to
-- whoever got there first, and the constraint is what makes that true rather
-- than a race between two ingest requests. Re-entering a different code on a
-- store we already know about is recorded in `affiliate.event` and changes
-- nothing here.
create table if not exists affiliate.referral (
  id            bigint      generated always as identity primary key,
  partner_id    bigint      not null references affiliate.partner (id) on delete cascade,
  code_id       bigint      not null references affiliate.code (id),

  -- The myshopify host, lower-cased, as normalised by `normaliseStoreInput`.
  shop          text        not null unique,
  -- The storefront name if the app knows it, so the dashboard can show
  -- "Acme Coffee" rather than a hostname. Null until an event carries one.
  shop_name     text,

  status        text        not null default 'linked'
                  check (status in ('linked', 'trialing', 'active', 'cancelled')),
  plan          text,

  linked_at     timestamptz not null default now(),
  activated_at  timestamptz,
  cancelled_at  timestamptz,
  last_event_at timestamptz not null default now()
);

create index if not exists referral_partner_idx on affiliate.referral (partner_id, linked_at desc);
create index if not exists referral_status_idx on affiliate.referral (status);

-- ---------------------------------------------------------------------------
-- Payouts
-- ---------------------------------------------------------------------------

-- Declared before `commission` because a commission points at the payout that
-- settled it.
--
-- One row per transfer we actually made. This build has no payments
-- integration: an admin pays by bank or PayPal and records it here, and
-- `reference` is whatever the bank called it, so a partner asking "where is
-- my money" can be answered with a number the bank also recognises.
create table if not exists affiliate.payout (
  id          bigint      generated always as identity primary key,
  partner_id  bigint      not null references affiliate.partner (id) on delete cascade,
  amount_cents bigint     not null check (amount_cents > 0),
  currency    text        not null,
  method      text        not null check (method in ('bank', 'paypal', 'wise', 'other')),
  reference   text,
  note        text,
  paid_at     timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists payout_partner_idx on affiliate.payout (partner_id, paid_at desc);

-- ---------------------------------------------------------------------------
-- Commissions — the ledger
-- ---------------------------------------------------------------------------

-- One row per amount earned. Append-only in spirit: a commission that turns
-- out to be wrong is `reversed`, not deleted, because the partner has already
-- seen it in their dashboard and a figure that silently shrinks is worse than
-- one that visibly reverses.
--
-- `amount_cents` is what we owe, not what the store paid; `charge_cents` keeps
-- what it was calculated from so the arithmetic can be re-checked years later
-- against a rate that has since changed.
create table if not exists affiliate.commission (
  id            bigint      generated always as identity primary key,
  partner_id    bigint      not null references affiliate.partner (id) on delete cascade,
  referral_id   bigint      not null references affiliate.referral (id) on delete cascade,

  -- Which rule produced it, copied from the partner at the time. Stored rather
  -- than derived because a partner who converts from influencer to agency must
  -- not retroactively change what their old rows meant.
  kind          text        not null check (kind in ('one_time', 'recurring')),

  amount_cents  bigint      not null check (amount_cents >= 0),
  currency      text        not null,
  charge_cents  bigint      not null check (charge_cents >= 0),
  rate_bps      integer     not null check (rate_bps between 0 and 10000),

  -- `pending` during the refund window, `approved` once it has cleared and is
  -- owed, `paid` when a payout settled it, `reversed` when the charge was
  -- refunded or the referral turned out to be invalid.
  status        text        not null default 'pending'
                  check (status in ('pending', 'approved', 'paid', 'reversed')),

  -- The billing period the charge covered, for the recurring case. Null for a
  -- one-time commission, which covers no period.
  period_start  timestamptz,
  period_end    timestamptz,

  payout_id     bigint      references affiliate.payout (id) on delete set null,

  -- The charge id from the Growsearch app. Unique, so replaying an event —
  -- which a retrying sender will do — cannot pay anyone twice.
  charge_ref    text        not null,

  created_at    timestamptz not null default now(),
  cleared_at    timestamptz,
  reversed_at   timestamptz
);

create unique index if not exists commission_charge_ref_key on affiliate.commission (charge_ref);
create index if not exists commission_partner_idx on affiliate.commission (partner_id, created_at desc);
create index if not exists commission_referral_idx on affiliate.commission (referral_id);
create index if not exists commission_status_idx on affiliate.commission (partner_id, status);
create index if not exists commission_payout_idx on affiliate.commission (payout_id);

-- The influencer rule, enforced by the database rather than trusted to the
-- caller. At most one live one-time commission per referral: a second insert
-- raises rather than quietly paying a second introduction fee for the same
-- store. Reversed rows are excluded so a genuine correction can be re-issued.
create unique index if not exists commission_one_time_per_referral
  on affiliate.commission (referral_id)
  where kind = 'one_time' and status <> 'reversed';

-- A commission cannot be `paid` without a payout to point at, and cannot point
-- at one unless it is. Cheap to state, and it is the invariant a "what do we
-- owe" query depends on.
alter table affiliate.commission drop constraint if exists commission_paid_has_payout;
alter table affiliate.commission add constraint commission_paid_has_payout
  check ((status = 'paid') = (payout_id is not null));

-- ---------------------------------------------------------------------------
-- Ingest log
-- ---------------------------------------------------------------------------

-- Every event the Growsearch app sends us, stored before it is applied.
--
-- Two jobs. `external_id` is the idempotency key: the insert is
-- `on conflict do nothing`, so a sender that retries after a timeout — the
-- normal case, not the rare one — cannot double-credit anybody, and the second
-- attempt is answered from `outcome` rather than re-run. And the raw payload
-- is kept so a disputed commission can be traced back to exactly what we were
-- told and when.
create table if not exists affiliate.event (
  id            bigint      generated always as identity primary key,
  external_id   text        not null unique,
  type          text        not null,
  shop          text,
  payload       jsonb       not null,
  -- What applying it did, in a word, so a support question can be answered
  -- from this table alone: `applied`, `ignored:unknown_code`, `failed:...`.
  outcome       text,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz
);

create index if not exists event_shop_idx on affiliate.event (shop, received_at desc);
create index if not exists event_received_idx on affiliate.event (received_at desc);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

-- Belt and braces. The dashboard reads these tables over postgres.js as the
-- `postgres` role, which has BYPASSRLS, and enforces access in the data-access
-- layer where Next.js wants it. RLS here is the second lock: it means that if
-- the `affiliate` schema is ever added to PostgREST's exposed schemas, the
-- anon key that ships in the browser bundle still cannot read one partner's
-- earnings — or anybody's payout details — by asking directly.
--
-- No policies are defined deliberately: RLS with no policy denies everything,
-- and nothing in this codebase reaches these tables through a role that
-- obeys it.
alter table affiliate.partner    enable row level security;
alter table affiliate.code       enable row level security;
alter table affiliate.referral   enable row level security;
alter table affiliate.commission enable row level security;
alter table affiliate.payout     enable row level security;
alter table affiliate.event      enable row level security;
