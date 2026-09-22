import "server-only";

import { transaction } from "@/lib/db";

import { suggestCode } from "./codes";
import { DEFAULT_RATE_BPS } from "./commission";
import { int, sql } from "./sql";
import type {
  AffiliateCode,
  Commission,
  DashboardSummary,
  Partner,
  PartnerKind,
  PayoutMethod,
  Payout,
  Referral,
  Totals,
} from "./types";

/**
 * Every read and write a partner makes about their own account.
 *
 * Nothing here takes a partner id from the client. Every caller gets one from
 * `requirePartner()` in `session.ts`, which is the only thing that decides
 * whose money is being looked at. The admin equivalent — the queries that
 * cross partner boundaries on purpose — lives in `admin-store.ts` behind its
 * own gate.
 *
 * `sql()` throws rather than returning null, and `int()` exists because
 * postgres.js hands back `int8` as a string. Both are in `./sql.ts`, with the
 * reasoning.
 */

/* ---------------------------------------------------------------------------
   Partners
--------------------------------------------------------------------------- */

type PartnerRow = {
  id: string;
  user_id: string;
  kind: PartnerKind;
  name: string;
  company: string;
  email: string;
  website: string | null;
  status: Partner["status"];
  commission_rate_bps: number;
  payout_method: PayoutMethod | null;
  payout_details: string | null;
  payout_currency: string;
  approved_at: Date | null;
  created_at: Date;
};

function toPartner(row: PartnerRow): Partner {
  return {
    id: int(row.id),
    userId: row.user_id,
    kind: row.kind,
    name: row.name,
    company: row.company,
    email: row.email,
    website: row.website,
    status: row.status,
    commissionRateBps: row.commission_rate_bps,
    payoutMethod: row.payout_method,
    payoutDetails: row.payout_details,
    payoutCurrency: row.payout_currency,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  };
}

/** The partner account belonging to a signed-in Supabase user, if there is one. */
export async function partnerByUserId(userId: string): Promise<Partner | null> {
  /* The column list is written out here and again in `createPartner` rather
     than shared through a constant. postgres.js interpolates a template value
     as a *parameter*, not as SQL, so a shared string would have to go through
     `sql.unsafe()` — and a helper whose name is "unsafe" has no business
     sitting in the middle of the two queries that read an account's payout
     details. Two literal lists that a compiler checks against `PartnerRow`
     are the cheaper safety. */
  const rows = await sql()<PartnerRow[]>`
    select id, user_id, kind, name, company, email, website, status,
           commission_rate_bps, payout_method, payout_details, payout_currency,
           approved_at, created_at
    from affiliate.partner
    where user_id = ${userId}
  `;
  return rows.length > 0 ? toPartner(rows[0]) : null;
}

export type NewPartner = {
  userId: string;
  kind: PartnerKind;
  name: string;
  company: string;
  email: string;
  website: string | null;
};

/**
 * Creates the partner account and its first code, together or not at all.
 *
 * The transaction matters: a partner with no code cannot refer anybody and has
 * no way to ask the dashboard for one, so the half-written state is a dead
 * account that looks like a working one.
 *
 * `suggestCode` draws five random characters from a 32-character alphabet, so a
 * collision is a one-in-thirty-three-million event for a given name stem — but
 * "unlikely" is not "handled", and the retry is three lines. Beyond the third
 * attempt something other than luck is wrong and it should surface.
 */
export async function createPartner(input: NewPartner): Promise<Partner> {
  const rate = DEFAULT_RATE_BPS[input.kind];

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = suggestCode(input.company);
    try {
      return await transaction(sql(), async (tx) => {
        const rows = await tx<PartnerRow[]>`
          insert into affiliate.partner
            (user_id, kind, name, company, email, website, commission_rate_bps)
          values
            (${input.userId}, ${input.kind}, ${input.name}, ${input.company},
             ${input.email}, ${input.website}, ${rate})
          returning id, user_id, kind, name, company, email, website, status,
                    commission_rate_bps, payout_method, payout_details, payout_currency,
                    approved_at, created_at
        `;
        const partner = toPartner(rows[0]);

        await tx`
          insert into affiliate.code (partner_id, code, label)
          values (${partner.id}, ${code}, 'Default')
        `;

        return partner;
      });
    } catch (err) {
      /* 23505 is unique_violation. It can mean either of two constraints here,
         and only one is worth retrying: a duplicate code is bad luck, while a
         duplicate user_id means this person already has an account and trying
         again would loop forever generating codes for a partner that exists. */
      if (isUniqueViolation(err, "code")) continue;
      throw err;
    }
  }

  throw new Error("Could not allocate an unused affiliate code after three attempts.");
}

function isUniqueViolation(err: unknown, contains?: string): boolean {
  if (typeof err !== "object" || err === null) return false;
  const pg = err as { code?: string; constraint_name?: string };
  if (pg.code !== "23505") return false;
  return contains ? (pg.constraint_name ?? "").includes(contains) : true;
}

/** Whether a Supabase user already has a partner account, without loading it. */
export async function partnerExists(userId: string): Promise<boolean> {
  const rows = await sql()`
    select 1 from affiliate.partner where user_id = ${userId}
  `;
  return rows.length > 0;
}

export async function updatePartnerProfile(
  partnerId: number,
  input: { name: string; company: string; website: string | null },
): Promise<void> {
  await sql()`
    update affiliate.partner
    set name = ${input.name},
        company = ${input.company},
        website = ${input.website},
        updated_at = now()
    where id = ${partnerId}
  `;
}

export async function updatePayoutPreferences(
  partnerId: number,
  input: { method: PayoutMethod; details: string; currency: string },
): Promise<void> {
  await sql()`
    update affiliate.partner
    set payout_method = ${input.method},
        payout_details = ${input.details},
        payout_currency = ${input.currency},
        updated_at = now()
    where id = ${partnerId}
  `;
}

/* ---------------------------------------------------------------------------
   Codes
--------------------------------------------------------------------------- */

export async function codesFor(partnerId: number): Promise<AffiliateCode[]> {
  const rows = await sql()<
    {
      id: string;
      code: string;
      label: string | null;
      active: boolean;
      created_at: Date;
      referral_count: string;
    }[]
  >`
    select c.id, c.code, c.label, c.active, c.created_at,
           count(r.id) as referral_count
    from affiliate.code c
    left join affiliate.referral r on r.code_id = c.id
    where c.partner_id = ${partnerId}
    group by c.id
    order by c.created_at asc
  `;

  return rows.map((row) => ({
    id: int(row.id),
    code: row.code,
    label: row.label,
    active: row.active,
    createdAt: row.created_at,
    referralCount: int(row.referral_count),
  }));
}

/* ---------------------------------------------------------------------------
   The ledger
--------------------------------------------------------------------------- */

type TotalsRow = {
  currency: string;
  pending: string;
  approved: string;
  paid: string;
};

function toTotals(row: TotalsRow): Totals {
  const pendingCents = int(row.pending);
  const approvedCents = int(row.approved);
  const paidCents = int(row.paid);
  return {
    currency: row.currency,
    pendingCents,
    approvedCents,
    paidCents,
    /* Lifetime is the sum of the three live states rather than a fourth query,
       and reversed rows are excluded by the WHERE clause below, so a reversal
       leaves the lifetime figure as if the commission had never been made. */
    lifetimeCents: pendingCents + approvedCents + paidCents,
  };
}

/**
 * Everything earned, split by state and by currency.
 *
 * Grouped by currency because the amount is whatever the store was charged in,
 * and Shopify decides that, not us. In practice one partner has one currency
 * and the extra rows are empty — but adding two currencies into one number is
 * the kind of wrong that looks right, so the query refuses to and the dashboard
 * shows the rest separately.
 *
 * Ordered by lifetime value so the first row is the currency the partner
 * actually earns in, whatever their payout preference says.
 */
export async function totalsFor(partnerId: number): Promise<Totals[]> {
  const rows = await sql()<TotalsRow[]>`
    select currency,
           coalesce(sum(amount_cents) filter (where status = 'pending'), 0)  as pending,
           coalesce(sum(amount_cents) filter (where status = 'approved'), 0) as approved,
           coalesce(sum(amount_cents) filter (where status = 'paid'), 0)     as paid
    from affiliate.commission
    where partner_id = ${partnerId}
      and status <> 'reversed'
    group by currency
    order by sum(amount_cents) desc
  `;
  return rows.map(toTotals);
}

type ReferralRow = {
  id: string;
  shop: string;
  shop_name: string | null;
  status: Referral["status"];
  plan: string | null;
  code: string;
  linked_at: Date;
  activated_at: Date | null;
  cancelled_at: Date | null;
  earned_cents: string;
  currency: string | null;
};

function toReferral(row: ReferralRow, fallbackCurrency: string): Referral {
  return {
    id: int(row.id),
    shop: row.shop,
    shopName: row.shop_name,
    status: row.status,
    plan: row.plan,
    code: row.code,
    linkedAt: row.linked_at,
    activatedAt: row.activated_at,
    cancelledAt: row.cancelled_at,
    earnedCents: int(row.earned_cents),
    currency: row.currency ?? fallbackCurrency,
  };
}

/**
 * The stores attributed to a partner — the "websites where they've entered
 * their affiliate code" list.
 *
 * `max(currency)` looks like a fudge and is not: a single store is billed in a
 * single currency, so every commission row under one referral shares one, and
 * `max` is simply how you carry a constant through a GROUP BY. A referral with
 * no commissions yet has none at all, hence the fallback.
 */
export async function referralsFor(
  partnerId: number,
  fallbackCurrency: string,
  limit = 200,
  offset = 0,
): Promise<Referral[]> {
  const rows = await sql()<ReferralRow[]>`
    select r.id, r.shop, r.shop_name, r.status, r.plan, c.code,
           r.linked_at, r.activated_at, r.cancelled_at,
           coalesce(sum(cm.amount_cents) filter (where cm.status <> 'reversed'), 0) as earned_cents,
           max(cm.currency) as currency
    from affiliate.referral r
    join affiliate.code c on c.id = r.code_id
    left join affiliate.commission cm on cm.referral_id = r.id
    where r.partner_id = ${partnerId}
    group by r.id, c.code
    /* The id breaks the tie. Two stores linked in the same second otherwise
       have no order between them at all, and Postgres is free to return them
       either way round on each query — so a LIMIT/OFFSET walk can show one of
       them on two pages and the other on none. */
    order by r.linked_at desc, r.id desc
    limit ${limit} offset ${offset}
  `;
  return rows.map((row) => toReferral(row, fallbackCurrency));
}

/**
 * How many stores a partner has referred, for a page count and a heading.
 *
 * Its own statement rather than `count(*) over ()` on the list query: that
 * query groups a join, and a window over a grouped join counts the groups only
 * as long as nobody changes the grouping. A count that stands alone is one
 * somebody can read and check.
 */
export async function referralCountFor(partnerId: number): Promise<number> {
  const rows = await sql()<{ n: string }[]>`
    select count(*) as n from affiliate.referral where partner_id = ${partnerId}
  `;
  return int(rows[0]?.n);
}

type CommissionRow = {
  id: string;
  kind: Commission["kind"];
  amount_cents: string;
  currency: string;
  charge_cents: string;
  rate_bps: number;
  status: Commission["status"];
  shop: string;
  shop_name: string | null;
  period_start: Date | null;
  period_end: Date | null;
  created_at: Date;
  cleared_at: Date | null;
};

function toCommission(row: CommissionRow): Commission {
  return {
    id: int(row.id),
    kind: row.kind,
    amountCents: int(row.amount_cents),
    currency: row.currency,
    chargeCents: int(row.charge_cents),
    rateBps: row.rate_bps,
    status: row.status,
    shop: row.shop,
    shopName: row.shop_name,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    createdAt: row.created_at,
    clearedAt: row.cleared_at,
  };
}

export async function commissionsFor(
  partnerId: number,
  limit = 100,
  offset = 0,
): Promise<Commission[]> {
  const rows = await sql()<CommissionRow[]>`
    select cm.id, cm.kind, cm.amount_cents, cm.currency, cm.charge_cents, cm.rate_bps,
           cm.status, r.shop, r.shop_name, cm.period_start, cm.period_end,
           cm.created_at, cm.cleared_at
    from affiliate.commission cm
    join affiliate.referral r on r.id = cm.referral_id
    where cm.partner_id = ${partnerId}
    /* The id breaks the tie, as on the referral list above: a month's charges
       are ingested in a batch and share a timestamp to the second. */
    order by cm.created_at desc, cm.id desc
    limit ${limit} offset ${offset}
  `;
  return rows.map(toCommission);
}

/** Every commission row a partner has, reversed ones included — the ledger's length. */
export async function commissionCountFor(partnerId: number): Promise<number> {
  const rows = await sql()<{ n: string }[]>`
    select count(*) as n from affiliate.commission where partner_id = ${partnerId}
  `;
  return int(rows[0]?.n);
}

export async function payoutsFor(partnerId: number): Promise<Payout[]> {
  const rows = await sql()<
    {
      id: string;
      amount_cents: string;
      currency: string;
      method: PayoutMethod;
      reference: string | null;
      note: string | null;
      paid_at: Date;
      commission_count: string;
    }[]
  >`
    select p.id, p.amount_cents, p.currency, p.method, p.reference, p.note, p.paid_at,
           count(cm.id) as commission_count
    from affiliate.payout p
    left join affiliate.commission cm on cm.payout_id = p.id
    where p.partner_id = ${partnerId}
    group by p.id
    order by p.paid_at desc
  `;

  return rows.map((row) => ({
    id: int(row.id),
    amountCents: int(row.amount_cents),
    currency: row.currency,
    method: row.method,
    reference: row.reference,
    note: row.note,
    paidAt: row.paid_at,
    commissionCount: int(row.commission_count),
  }));
}

/**
 * The overview page, in four queries rather than four round trips.
 *
 * They are independent, so they go out together. The alternative — awaiting
 * each in turn — costs four times the latency to Supabase for no benefit, and
 * on a pooled connection from a serverless instance that latency is the whole
 * cost of the page.
 */
export async function dashboardSummary(
  partnerId: number,
  fallbackCurrency: string,
): Promise<DashboardSummary> {
  const [totals, counts, recentCommissions, recentReferrals] = await Promise.all([
    totalsFor(partnerId),
    /* One bucket per status, and every status the schema has. The overview
       prints these under the total, so a status folded into another one — or
       left out, as cancelled was — is a note whose parts do not add up to the
       number above them. Trialing is its own bucket because the stores page
       calls those stores "On trial" rather than subscribed, and two screens
       that count the same store differently is the bug this replaces. */
    sql()<
      { total: string; active: string; trialing: string; linked: string; cancelled: string }[]
    >`
      select count(*)                                       as total,
             count(*) filter (where status = 'active')      as active,
             count(*) filter (where status = 'trialing')    as trialing,
             count(*) filter (where status = 'linked')      as linked,
             count(*) filter (where status = 'cancelled')   as cancelled
      from affiliate.referral
      where partner_id = ${partnerId}
    `,
    commissionsFor(partnerId, 8),
    referralsFor(partnerId, fallbackCurrency, 8),
  ]);

  const empty: Totals = {
    currency: fallbackCurrency,
    pendingCents: 0,
    approvedCents: 0,
    paidCents: 0,
    lifetimeCents: 0,
  };

  return {
    totals: totals[0] ?? empty,
    otherCurrencies: totals.slice(1),
    referrals: {
      total: int(counts[0]?.total),
      active: int(counts[0]?.active),
      trialing: int(counts[0]?.trialing),
      linked: int(counts[0]?.linked),
      cancelled: int(counts[0]?.cancelled),
    },
    recentCommissions,
    recentReferrals,
  };
}
