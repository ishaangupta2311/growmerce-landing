import "server-only";

import { randomUUID } from "node:crypto";

import { transaction } from "@/lib/db";

import { ingest, parseEvent } from "./ingest";
import { int, json, sql } from "./sql";
import type { Partner, PartnerKind, PartnerStatus, PayoutMethod } from "./types";

/**
 * The queries that cross partner boundaries on purpose.
 *
 * Everything in `store.ts` is scoped to one partner id that came from
 * `requirePartner()`. Everything here reads or writes across all of them, which
 * is exactly what an admin needs and exactly what a partner must never reach —
 * so every caller of this file is behind `requireAdmin()`, and the split
 * between the two files is what makes that reviewable. If a query in here ever
 * ends up imported by a dashboard page, that import is the bug, and it is
 * visible in one line of a diff.
 *
 * Nothing here trusts an amount typed by a human. The one function that moves
 * money — `recordPayout` — derives the figure from the rows it settles and
 * refuses if the number the admin was shown has moved since.
 */

/* ---------------------------------------------------------------------------
   Reading
--------------------------------------------------------------------------- */

/** A partner as the admin list shows them: the account, plus what it has done. */
export type AdminPartner = {
  id: number;
  kind: PartnerKind;
  name: string;
  company: string;
  email: string;
  website: string | null;
  status: PartnerStatus;
  commissionRateBps: number;
  payoutMethod: PayoutMethod | null;
  payoutCurrency: string;
  createdAt: Date;
  approvedAt: Date | null;
  referralCount: number;
  activeReferralCount: number;
  /** Lifetime earnings in the currency this partner earns most in, or null. */
  headline: { currency: string; lifetimeCents: number; owedCents: number } | null;
};

type AdminPartnerRow = {
  id: string;
  kind: PartnerKind;
  name: string;
  company: string;
  email: string;
  website: string | null;
  status: PartnerStatus;
  commission_rate_bps: number;
  payout_method: PayoutMethod | null;
  payout_currency: string;
  created_at: Date;
  approved_at: Date | null;
  referral_count: string;
  active_referral_count: string;
  currency: string | null;
  lifetime_cents: string;
  owed_cents: string;
};

function toAdminPartner(row: AdminPartnerRow): AdminPartner {
  return {
    id: int(row.id),
    kind: row.kind,
    name: row.name,
    company: row.company,
    email: row.email,
    website: row.website,
    status: row.status,
    commissionRateBps: row.commission_rate_bps,
    payoutMethod: row.payout_method,
    payoutCurrency: row.payout_currency,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    referralCount: int(row.referral_count),
    activeReferralCount: int(row.active_referral_count),
    headline: row.currency
      ? {
          currency: row.currency,
          lifetimeCents: int(row.lifetime_cents),
          owedCents: int(row.owed_cents),
        }
      : null,
  };
}

export type PartnerFilter = {
  status?: PartnerStatus;
  kind?: PartnerKind;
  /** Matches name, company or email. */
  q?: string;
};

/**
 * The partner list.
 *
 * The two aggregates are separate lateral subqueries rather than joins, and
 * that is not a style preference: joining `referral` and `commission` in one
 * statement multiplies the rows against each other, so a partner with three
 * stores and four commissions gets counted twelve times. The bug reads as
 * "our best agency has 12 stores" and nobody questions it.
 *
 * The money column is one currency — whichever the partner has earned most in.
 * A partner with two is rare and the detail page shows both; adding them
 * together to fill a column would be worse than showing one.
 */
export async function listPartners(filter: PartnerFilter = {}): Promise<AdminPartner[]> {
  const like = filter.q ? `%${filter.q.trim()}%` : null;

  const rows = await sql()<AdminPartnerRow[]>`
    select p.id, p.kind, p.name, p.company, p.email, p.website, p.status,
           p.commission_rate_bps, p.payout_method, p.payout_currency,
           p.created_at, p.approved_at,
           r.referral_count, r.active_referral_count,
           m.currency, coalesce(m.lifetime_cents, 0) as lifetime_cents,
           coalesce(m.owed_cents, 0) as owed_cents
    from affiliate.partner p
    left join lateral (
      select count(*)                                                 as referral_count,
             count(*) filter (where status in ('active', 'trialing')) as active_referral_count
      from affiliate.referral
      where partner_id = p.id
    ) r on true
    left join lateral (
      select currency,
             sum(amount_cents)                                as lifetime_cents,
             sum(amount_cents) filter (where status = 'approved') as owed_cents
      from affiliate.commission
      where partner_id = p.id and status <> 'reversed'
      group by currency
      order by sum(amount_cents) desc
      limit 1
    ) m on true
    where (${filter.status ?? null}::text is null or p.status = ${filter.status ?? null})
      and (${filter.kind ?? null}::text is null or p.kind = ${filter.kind ?? null})
      and (${like}::text is null
           or p.name ilike ${like} or p.company ilike ${like} or p.email ilike ${like})
    order by
      /* Applications first, because they are the only rows with a deadline
         attached: somebody is waiting on an answer. */
      case when p.status = 'pending' then 0 else 1 end,
      p.created_at desc
    limit 300
  `;

  return rows.map(toAdminPartner);
}

/**
 * One partner, by id.
 *
 * The partner-facing `partnerByUserId` looks an account up by the session that
 * owns it, which is what makes it safe to call from a dashboard page. This one
 * takes an id straight from a URL, and is safe only because `requireAdmin()`
 * ran first — which is the entire reason it lives in this file rather than
 * beside its cousin.
 */
export async function partnerById(partnerId: number): Promise<Partner | null> {
  const rows = await sql()<
    {
      id: string;
      user_id: string;
      kind: PartnerKind;
      name: string;
      company: string;
      email: string;
      website: string | null;
      status: PartnerStatus;
      commission_rate_bps: number;
      payout_method: PayoutMethod | null;
      payout_details: string | null;
      payout_currency: string;
      approved_at: Date | null;
      created_at: Date;
    }[]
  >`
    select id, user_id, kind, name, company, email, website, status,
           commission_rate_bps, payout_method, payout_details, payout_currency,
           approved_at, created_at
    from affiliate.partner
    where id = ${partnerId}
  `;

  if (rows.length === 0) return null;
  const row = rows[0];
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

/**
 * Every payout we have recorded, newest first — the reconciliation view.
 *
 * Carries the partner's name so this page can be read against a bank statement
 * without opening a row, which is the only thing anybody does with it.
 */
export type AdminPayout = {
  id: number;
  partnerId: number;
  partnerName: string;
  company: string;
  amountCents: number;
  currency: string;
  method: PayoutMethod;
  reference: string | null;
  note: string | null;
  paidAt: Date;
  commissionCount: number;
};

export async function recentPayouts(limit = 100): Promise<AdminPayout[]> {
  const rows = await sql()<
    {
      id: string;
      partner_id: string;
      partner_name: string;
      company: string;
      amount_cents: string;
      currency: string;
      method: PayoutMethod;
      reference: string | null;
      note: string | null;
      paid_at: Date;
      commission_count: string;
    }[]
  >`
    select po.id, po.partner_id, p.name as partner_name, p.company,
           po.amount_cents, po.currency, po.method, po.reference, po.note, po.paid_at,
           count(cm.id) as commission_count
    from affiliate.payout po
    join affiliate.partner p on p.id = po.partner_id
    left join affiliate.commission cm on cm.payout_id = po.id
    group by po.id, p.name, p.company
    order by po.paid_at desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: int(row.id),
    partnerId: int(row.partner_id),
    partnerName: row.partner_name,
    company: row.company,
    amountCents: int(row.amount_cents),
    currency: row.currency,
    method: row.method,
    reference: row.reference,
    note: row.note,
    paidAt: row.paid_at,
    commissionCount: int(row.commission_count),
  }));
}

/** The numbers on the admin landing page. */
export type AdminOverview = {
  pendingApplications: number;
  approvedPartners: number;
  /** Stores attributed across the whole program. */
  referrals: number;
  /** Paying right now — `active` alone, so it means the same word here as on a
      partner's own overview. */
  activeReferrals: number;
  /** On a trial: not paying yet, and not to be added to the figure above. */
  trialingReferrals: number;
  /** What we owe right now, per currency — approved and not yet paid. */
  owed: { currency: string; cents: number; partners: number }[];
  /** What is still inside the refund window, per currency. */
  clearing: { currency: string; cents: number }[];
};

export async function adminOverview(): Promise<AdminOverview> {
  /* Two queries rather than the obvious four. Each round trip to Supabase costs
     roughly a third of a second from here, so the count of round trips *is* the
     page's speed — and a fan-out has to stay well inside the connection pool
     (see `src/lib/db.ts`), which is the more expensive reason to keep it small. */
  const [counts, money] = await Promise.all([
    sql()<
      {
        pending_partners: string;
        approved_partners: string;
        referrals: string;
        active_referrals: string;
        trialing_referrals: string;
      }[]
    >`
      select
        (select count(*) from affiliate.partner where status = 'pending')  as pending_partners,
        (select count(*) from affiliate.partner where status = 'approved') as approved_partners,
        (select count(*) from affiliate.referral)                          as referrals,
        (select count(*) from affiliate.referral
          where status = 'active')                                         as active_referrals,
        (select count(*) from affiliate.referral
          where status = 'trialing')                                       as trialing_referrals
    `,
    /* Owed and clearing in one pass over the ledger: they are the same rows
       grouped the same way, differing only in which status is being summed. */
    sql()<
      {
        currency: string;
        owed_cents: string;
        owed_partners: string;
        clearing_cents: string;
      }[]
    >`
      select currency,
             coalesce(sum(amount_cents) filter (where status = 'approved'), 0) as owed_cents,
             count(distinct partner_id) filter (where status = 'approved')     as owed_partners,
             coalesce(sum(amount_cents) filter (where status = 'pending'), 0)  as clearing_cents
      from affiliate.commission
      where status in ('approved', 'pending')
      group by currency
    `,
  ]);

  /* A currency appears in one list, the other, or both. Sorted separately
     because "most owed" and "most clearing" are different questions and the
     page shows the largest of each. */
  const owed = money
    .filter((row) => int(row.owed_cents) > 0)
    .map((row) => ({
      currency: row.currency,
      cents: int(row.owed_cents),
      partners: int(row.owed_partners),
    }))
    .sort((a, b) => b.cents - a.cents);

  const clearing = money
    .filter((row) => int(row.clearing_cents) > 0)
    .map((row) => ({ currency: row.currency, cents: int(row.clearing_cents) }))
    .sort((a, b) => b.cents - a.cents);

  return {
    pendingApplications: int(counts[0]?.pending_partners),
    approvedPartners: int(counts[0]?.approved_partners),
    referrals: int(counts[0]?.referrals),
    activeReferrals: int(counts[0]?.active_referrals),
    trialingReferrals: int(counts[0]?.trialing_referrals),
    owed,
    clearing,
  };
}

/**
 * One line per payout that needs making: a partner, a currency, and the exact
 * sum of what has cleared and not been settled.
 *
 * Per currency rather than per partner because a payout *is* per currency —
 * one bank transfer moves one currency — so this is the unit of work, and a
 * partner earning in two gets two rows and two transfers.
 */
export type AmountDue = {
  partnerId: number;
  name: string;
  company: string;
  email: string;
  kind: PartnerKind;
  status: PartnerStatus;
  payoutMethod: PayoutMethod | null;
  payoutDetails: string | null;
  currency: string;
  owedCents: number;
  commissionCount: number;
  /** When the oldest unsettled commission cleared — i.e. how long they have waited. */
  waitingSince: Date | null;
};

export async function amountsDue(): Promise<AmountDue[]> {
  const rows = await sql()<
    {
      partner_id: string;
      name: string;
      company: string;
      email: string;
      kind: PartnerKind;
      status: PartnerStatus;
      payout_method: PayoutMethod | null;
      payout_details: string | null;
      currency: string;
      owed_cents: string;
      commission_count: string;
      waiting_since: Date | null;
    }[]
  >`
    select cm.partner_id, p.name, p.company, p.email, p.kind, p.status,
           p.payout_method, p.payout_details,
           cm.currency,
           sum(cm.amount_cents) as owed_cents,
           count(*)             as commission_count,
           min(cm.cleared_at)   as waiting_since
    from affiliate.commission cm
    join affiliate.partner p on p.id = cm.partner_id
    where cm.status = 'approved'
    group by cm.partner_id, p.name, p.company, p.email, p.kind, p.status,
             p.payout_method, p.payout_details, cm.currency
    order by min(cm.cleared_at) asc nulls last
  `;

  return rows.map((row) => ({
    partnerId: int(row.partner_id),
    name: row.name,
    company: row.company,
    email: row.email,
    kind: row.kind,
    status: row.status,
    payoutMethod: row.payout_method,
    payoutDetails: row.payout_details,
    currency: row.currency,
    owedCents: int(row.owed_cents),
    commissionCount: int(row.commission_count),
    waitingSince: row.waiting_since,
  }));
}

/**
 * How many charges were thrown away because the partner was not approved yet.
 *
 * This is the number that makes approving somebody a decision rather than a
 * formality. `applyCharge` refuses a charge for a `pending` partner outright —
 * no commission row is written — so a store that paid while the application sat
 * in the queue earned its referrer nothing, and only the event log remembers
 * it. See `replaySkippedCharges`.
 */
export async function skippedChargeCount(partnerId: number): Promise<number> {
  const rows = await sql()<{ n: string }[]>`
    select count(*) as n
    from affiliate.event e
    join affiliate.referral r on r.shop = e.shop
    where r.partner_id = ${partnerId}
      and e.type = 'charge.succeeded'
      and e.outcome = 'ignored:partner_not_approved'
  `;
  return int(rows[0]?.n);
}

/** The ingest log, for answering "why is my client missing from my dashboard". */
export type AdminEvent = {
  id: number;
  externalId: string;
  type: string;
  shop: string | null;
  outcome: string | null;
  receivedAt: Date;
  payload: Record<string, unknown>;
};

export async function recentEvents(limit = 100, shop?: string): Promise<AdminEvent[]> {
  const like = shop ? `%${shop.trim()}%` : null;
  const rows = await sql()<
    {
      id: string;
      external_id: string;
      type: string;
      shop: string | null;
      outcome: string | null;
      received_at: Date;
      payload: unknown;
    }[]
  >`
    select id, external_id, type, shop, outcome, received_at, payload
    from affiliate.event
    where (${like}::text is null or shop ilike ${like})
    order by received_at desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: int(row.id),
    externalId: row.external_id,
    type: row.type,
    shop: row.shop,
    outcome: row.outcome,
    receivedAt: row.received_at,
    payload: json(row.payload),
  }));
}

/* ---------------------------------------------------------------------------
   Writing
--------------------------------------------------------------------------- */

/**
 * Approve, reject or suspend.
 *
 * `approved_at` is set with `coalesce`, so a partner suspended and reinstated
 * keeps the date they were first approved. That date is the start of the
 * relationship and is not ours to move — it is what a partner will cite in the
 * email arguing about a commission.
 */
export async function setPartnerStatus(
  partnerId: number,
  status: PartnerStatus,
): Promise<Partner["status"]> {
  const rows = await sql()<{ status: PartnerStatus }[]>`
    update affiliate.partner
    set status = ${status},
        approved_at = case when ${status} = 'approved' then coalesce(approved_at, now())
                           else approved_at end,
        updated_at = now()
    where id = ${partnerId}
    returning status
  `;
  if (rows.length === 0) throw new Error(`No partner ${partnerId}.`);
  return rows[0].status;
}

/**
 * Change what a partner earns from here on.
 *
 * Only from here on. Existing commissions keep the `rate_bps` they were
 * calculated with — the column exists for exactly this — so nothing already in
 * a partner's dashboard changes when this runs. That is the correct behaviour
 * and it is also the surprising one, which is why the form says it out loud.
 */
export async function setCommissionRate(partnerId: number, rateBps: number): Promise<void> {
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10_000) {
    throw new Error(`A commission rate must be 0–10000 basis points, not ${rateBps}.`);
  }
  const rows = await sql()`
    update affiliate.partner
    set commission_rate_bps = ${rateBps}, updated_at = now()
    where id = ${partnerId}
    returning id
  `;
  if (rows.length === 0) throw new Error(`No partner ${partnerId}.`);
}

export type PayoutRequest = {
  partnerId: number;
  currency: string;
  method: PayoutMethod;
  reference: string | null;
  note: string | null;
  /**
   * What the admin was shown as owed when they opened the form. The payout is
   * refused if the real figure has moved since — see below.
   */
  expectedCents: number;
};

export type PayoutResult =
  | { ok: true; payoutId: number; amountCents: number; commissionCount: number }
  | { ok: false; reason: "nothing_owed" }
  | { ok: false; reason: "amount_moved"; actualCents: number };

/**
 * Records a payment that has already been made, and settles what it covered.
 *
 * Three things make this safe, and all three matter:
 *
 * **The amount is derived, never typed.** It is the sum of the rows this
 * settles. An admin cannot record a payout for a figure that does not match
 * what the ledger says was owed, because they are never asked for a figure.
 *
 * **`for update` before the sum.** Two admins on the payouts page at once,
 * or one who double-submits, would otherwise both read the same approved rows
 * and both create a payout for them. The lock makes the second wait, and by
 * the time it runs there is nothing in `approved` left to settle, so it
 * reports `nothing_owed` instead of paying twice.
 *
 * **`expectedCents` is checked against reality.** The hold sweep runs on every
 * ingest, so commissions can clear between the page rendering and the button
 * being pressed. Silently paying the larger figure would attach a bank
 * reference for £980 to a £1,450 record; this refuses and asks them to look
 * again.
 *
 * The insert and the update are one transaction because
 * `commission_paid_has_payout` makes them meaningless apart: a commission
 * cannot be `paid` without a payout to point at, and a payout with nothing
 * pointing at it is money we cannot explain.
 */
export async function recordPayout(input: PayoutRequest): Promise<PayoutResult> {
  return transaction(sql(), async (tx) => {
    const owed = await tx<{ id: string; amount_cents: string }[]>`
      select id, amount_cents
      from affiliate.commission
      where partner_id = ${input.partnerId}
        and currency = ${input.currency}
        and status = 'approved'
      /* Ordered so two concurrent payouts for one partner take the rows in the
         same sequence and queue instead of deadlocking. */
      order by id
      for update
    `;

    if (owed.length === 0) return { ok: false as const, reason: "nothing_owed" as const };

    const total = owed.reduce((sum, row) => sum + int(row.amount_cents), 0);
    if (total !== input.expectedCents) {
      return { ok: false as const, reason: "amount_moved" as const, actualCents: total };
    }
    if (total <= 0) return { ok: false as const, reason: "nothing_owed" as const };

    const [payout] = await tx<{ id: string }[]>`
      insert into affiliate.payout
        (partner_id, amount_cents, currency, method, reference, note)
      values
        (${input.partnerId}, ${total}, ${input.currency}, ${input.method},
         ${input.reference}, ${input.note})
      returning id
    `;

    const ids = owed.map((row) => int(row.id));
    await tx`
      update affiliate.commission
      set status = 'paid', payout_id = ${int(payout.id)}
      where id in ${tx(ids)}
    `;

    return {
      ok: true as const,
      payoutId: int(payout.id),
      amountCents: total,
      commissionCount: ids.length,
    };
  });
}

/**
 * Pays the charges that arrived while an application was still in the queue.
 *
 * A store that paid us before we approved its referrer earned them nothing:
 * `applyCharge` returns `partner_not_approved` and no commission row is
 * written. Only `affiliate.event` remembers it happened. That is defensible on
 * the day it happens and indefensible a week later, when we have approved the
 * partner and their dashboard shows a store that is subscribed and has never
 * paid them.
 *
 * So this re-feeds those events through the ordinary ingest. Two properties
 * make it safe to press twice:
 *
 * - The events go through `ingest()` like any other, so `charge_ref` uniqueness
 *   applies. A charge already credited comes back `charge_already_credited`
 *   and no second commission is written.
 * - A charge that was refunded while the application sat in the queue comes
 *   back `charge_refunded` and earns nothing. The refund found no commission to
 *   reverse at the time, so the event log is the only thing that remembers it;
 *   `applyCharge` is given that fact rather than left to infer it from a ledger
 *   the refund never reached.
 * - A replayed event is given a fresh `external_id` — the original is taken —
 *   and the original row's outcome is marked so it is not picked up again.
 *
 * Returns what happened, because "we replayed 4 charges and 3 earned" is the
 * only honest thing to tell an admin who is about to email the partner.
 */
export async function replaySkippedCharges(
  partnerId: number,
): Promise<{ replayed: number; earned: number }> {
  const rows = await sql()<{ id: string; payload: unknown; received_at: Date }[]>`
    select e.id, e.payload, e.received_at
    from affiliate.event e
    join affiliate.referral r on r.shop = e.shop
    where r.partner_id = ${partnerId}
      and e.type = 'charge.succeeded'
      and e.outcome = 'ignored:partner_not_approved'
    /* Oldest charge first, by the charge's own moment rather than by when the
       delivery happened to reach us: a partner's earliest charge is the one
       that decides an influencer's single one-time commission, so a store
       whose March invoice was delivered ahead of its January one would
       otherwise have that fee priced off the wrong charge. The delivery time
       stands in when the sender supplied no occurredAt, and the id breaks a
       tie between two charges stamped the same instant, so the order is total
       and a replay is repeatable.

       Nothing here is backquoted: the comment sits inside the tagged template,
       where a backtick would end the query. */
    order by coalesce((e.payload->>'occurredAt')::timestamptz, e.received_at) asc, e.id asc
  `;

  let earned = 0;

  for (const row of rows) {
    /* `json()` and not a spread of the raw column: the column is `unknown` at
       the query boundary and `json()` is what narrows it to an object. It does
       not parse anything any more — since `0007_affiliate_event_payload.sql`
       the payload is a real jsonb object and postgres.js hands it back as one.

       `occurredAt` goes in *before* the spread so a sender that supplied one
       still wins. When none was sent, the time we received the event stands in
       for it — later than the charge by minutes, where the alternative is
       `applyCharge` treating a months-old charge as though it were collected
       today and judging it against the store's status now. */
    const event = parseEvent({
      occurredAt: row.received_at.toISOString(),
      ...json(row.payload),
      id: randomUUID(),
    });
    const outcome = await ingest(event);
    if (outcome.status === "applied") earned++;

    await sql()`
      update affiliate.event
      set outcome = 'ignored:partner_not_approved (replayed)'
      where id = ${int(row.id)}
    `;
  }

  return { replayed: rows.length, earned };
}
