# The affiliate program

Web-dev agencies and creators refer stores to Growmerce and get paid for it.
This document is the operator's copy: what is built, what it needs, and the two
things that are not built yet.

The commercial rule, which everything else serves:

| | earns | on | for |
| --- | --- | --- | --- |
| **Agency** | 20% | every payment a referred store makes | as long as the store stays subscribed |
| **Creator** | 30% | the first payment only | once per store |

Both rates are defaults, set in `src/lib/affiliate/commission.ts` and **not yet
signed off commercially**. They are copied onto the partner row at sign-up, so
changing them affects new partners only — an existing partner's terms cannot be
altered by a deploy, which is correct for a number somebody agreed to.

## What to set before it works

Three environment variables beyond `DATABASE_URL`, plus `AFFILIATE_ADMIN_EMAILS`
for the admin area (see *The admin side*, below). All five are listed in
`.env.example`.

```bash
# Supabase — Project Settings → API, same project as DATABASE_URL.
# Both are public by design; the anon key ships in the browser bundle.
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>

# Shared with the Growsearch app. It signs every event that writes money into
# the ledger, so treat it like a payment key: 32 bytes minimum, rotate on
# suspicion, and never in a client bundle.
#   openssl rand -hex 32
AFFILIATE_INGEST_SECRET=<64 hex characters>
```

Without the Supabase pair, every page under `/affiliates` throws with a message
naming both variables. That is deliberate: a login form that renders without a
client takes a password, appears to submit, and does nothing.

Without `AFFILIATE_INGEST_SECRET`, `/api/affiliate/events` answers `503` to
everything. Also deliberate — a deployment that cannot authenticate the sender
cannot safely accept an event that creates a commission.

In Supabase, set **Authentication → URL Configuration → Redirect URLs** to
include `https://growmerce.ai/affiliates/auth/callback` (and the equivalent for
any preview domain). Emailed confirmation and recovery links land there.

## The schema

`migrations/0002_affiliate.sql`, applied. Six tables in their own `affiliate`
schema:

- **`partner`** — one per affiliate account, keyed to a Supabase `auth.users`
  row. Carries `kind`, `status` and the negotiated `commission_rate_bps`.
- **`code`** — the string a merchant types into Growsearch. A partner may hold
  several; retired rather than deleted, because referrals hang off them.
- **`referral`** — one per store. `shop` is unique **across the whole table**:
  a store belongs to whoever got there first, permanently.
- **`commission`** — the ledger. Append-only in spirit; a wrong row is
  `reversed`, never deleted.
- **`payout`** — one per transfer actually made.
- **`event`** — every ingest request, stored before it is applied.

Two constraints do real work and are worth knowing about:

- A partial unique index on `commission (referral_id) where kind = 'one_time'
  and status <> 'reversed'` makes it *impossible* to pay a creator twice for the
  same store, whatever the application code does.
- `charge_ref` is unique, so the same charge cannot be credited twice even under
  two different event ids.

RLS is enabled on all six with **no policies**, which denies everything. The
dashboard reads them over postgres.js as the `postgres` role, which bypasses
RLS, and enforces access in the data-access layer instead. The RLS is there so
that if the schema is ever added to PostgREST's exposed list, the anon key in
the browser bundle still cannot read one partner's earnings.

## What the Growsearch app has to send

`POST /api/affiliate/events`, server to server. One event or
`{ "events": [...] }`, up to 50.

```
x-growmerce-timestamp: 1757462400000          # ms since epoch
x-growmerce-signature: sha256=<hmac>          # HMAC-SHA256 of `${timestamp}.${rawBody}`
```

The timestamp is *inside* the signed string, and requests more than five minutes
out of date are rejected — signing only the body would leave a captured request
valid forever. Sign the exact bytes you send; do not re-serialise.

| type | required | what it does |
| --- | --- | --- |
| `referral.linked` | `code` | Attributes the store. First code wins. |
| `subscription.activated` | — | Marks it subscribed. `plan` optional. |
| `subscription.cancelled` | — | Marks it churned. Later charges earn nothing. |
| `charge.succeeded` | `chargeId`, `amountCents`, `currency` | **Creates the commission.** |
| `charge.refunded` | `chargeId` | Reverses it, unless already paid out. |

Every event needs `id` (the sender's idempotency key, stable across retries of
the same occurrence — a UUID minted when the event is queued, not per HTTP
attempt) and `shop`.

`amountCents` is an integer of **minor units**. `19.99` where `1999` was meant
is rejected rather than coerced, because the coercion would credit an agency
nineteen cents and nobody would notice for months.

```jsonc
{
  "id": "e3a1…",
  "type": "charge.succeeded",
  "shop": "acme.myshopify.com",
  "chargeId": "gid://shopify/AppSubscription/12345",
  "amountCents": 4900,
  "currency": "USD",
  "periodStart": "2026-09-01T00:00:00Z",
  "periodEnd": "2026-10-01T00:00:00Z"
}
```

**A 2xx means stop retrying.** That covers events applied, events deliberately
ignored (an unknown code will not become known by asking again), and events
already seen. Only a 5xx asks for another attempt.

### Clearing the refund window

Commissions sit in `pending` for 30 days, then become `approved` and are owed.
The sweep runs at most hourly inside the ingest route, so an active program
needs no scheduler. A *quiet* one does — a partner whose last referral churned
in January must still see their December commissions clear. Point a nightly cron
at the same endpoint with an empty body and a valid signature:

```
POST /api/affiliate/events   body: {}
```

## Testing it

```bash
npm run smoke:affiliate
```

Creates two scratch partners, feeds them the events above, asserts the money
comes out right, and deletes everything it made — including on failure. It runs
against the real database, so it is a developer tool rather than something to
point at production casually. Twenty checks, covering the influencer
double-payment guard, event replay, charge replay under a new event id, refund
reversal, and charges arriving after cancellation.

## The admin side

`/admin/affiliates`, inside the site's one admin at `/admin` — the blog is
administered from the same dashboard, behind the same sign-in. Deliberately
unlinked from anywhere public — the only way in is to type it, or to follow the
"Admin" link that appears on your own partner dashboard if you are one. The old
`/affiliates/admin` addresses redirect there.

Who is an admin — for the blog as much as for affiliates — comes from an
environment variable and nothing else:

```bash
# Comma-separated. Unset means nobody is an admin — it fails closed.
AFFILIATE_ADMIN_EMAILS=you@growmerce.ai,someone@growmerce.ai
```

That is not laziness. Admin is the one privilege the application must have no
way to grant itself: a column on `affiliate.partner` would be one careless
update away from a partner approving their own application and setting their own
rate to 100%. An env var is outside everything a request can reach. Adding an
admin costs a deploy, which for a list this short is the point.

It is checked against a **verified** session — `getUser()`, which validates the
JWT with Supabase, not `getSession()`, which trusts the cookie. A signed-in
non-admin gets a 404 rather than a refusal, so the address never confirms it is
real.

Four tabs:

- **Overview** — what needs doing. Applications first, because a person is
  waiting on each one.
- **Partners** — everyone, filterable. The filters are URLs, so any view of the
  list is a link you can paste to somebody.
- **Payouts** — one row per partner *per currency*, because one transfer moves
  one currency. Open a row to record a payment.
- **Ingest log** — every event the Growsearch app sent and what we did with it.
  This is where "why is my client missing?" gets answered.

### Approving replays held charges

Worth knowing, because it is the one place the admin UI does more than it
appears to. `applyCharge` refuses a charge outright when the partner is not
approved — **no commission row is written at all**, and only the event log
remembers it happened. So a store that pays while an application sits in the
queue earns its referrer nothing.

Approving a partner re-feeds those events through the ordinary ingest at the
partner's current rate. It is safe to run twice: a charge already credited is
refused by `commission_charge_ref_key`, not paid again. A partner approved with
charges still held shows a "Replay held charges" panel to do it by hand.

### Recording a payout

The admin never types an amount. The figure is the sum of the `approved`
commissions being settled, the rows are locked before it is summed, and the
amount the page displayed is submitted back and checked against the live total —
so if commission cleared while the form was open, the payout is refused rather
than silently made larger. The insert and the settle are one transaction,
because `commission_paid_has_payout` makes them meaningless apart.

Doing it by hand is still possible and still has to be one statement:

```sql
with p as (
  insert into affiliate.payout (partner_id, amount_cents, currency, method, reference)
  values (1, 98000, 'USD', 'bank', 'FT26091234')
  returning id
)
update affiliate.commission set status = 'paid', payout_id = (select id from p)
where partner_id = 1 and status = 'approved' and currency = 'USD';
```

## What is not built

**Payouts are recorded, not made.** There is no Stripe Connect, no PayPal API,
no KYC. An admin pays by bank transfer and writes it down. The `payout` table is
shaped for a real integration to slot into later.

**Nothing is audited.** The admin UI shows who is signed in while they work, but
nobody records that a rate was changed from 20% to 25% on a Tuesday, or by whom.
For a two-person admin list that is survivable; for a larger one it is the next
thing to build.

**Rates are per partner, changed by hand.** There is no notion of a tier, a
promotion, or a rate that changes on a date.
