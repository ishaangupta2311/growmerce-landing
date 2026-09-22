import "server-only";

import type { Sql, TransactionSql } from "postgres";

import { db } from "@/lib/db";
import { normaliseStoreInput } from "@/lib/store-domain";

import { normaliseCode } from "./codes";
import { applyCharge, HOLD_DAYS } from "./commission";
import type { PartnerKind, PartnerStatus } from "./types";

/**
 * Turning what the Growsearch app tells us into rows in the ledger.
 *
 * The app is the only thing that knows a merchant typed an affiliate code into
 * its settings, and Shopify is the only thing that knows they then paid us. So
 * the app forwards both, as events, to `/api/affiliate/events`; this file is
 * what those events mean.
 *
 * Three properties this has to have, in order of how expensive they are to get
 * wrong:
 *
 * 1. **Replaying an event must not pay anybody twice.** A sender that times out
 *    will retry, and that is the normal case rather than the exceptional one.
 *    Every event carries an `id` from the sender, `affiliate.event.external_id`
 *    is unique, and the insert is `on conflict do nothing` — so the second
 *    delivery is answered out of the table instead of being applied again.
 *    Commissions have a second, independent guard on `charge_ref`, because
 *    idempotency that depends on the sender remembering to send a stable id is
 *    idempotency that depends on somebody else's bug.
 *
 * 2. **An event we cannot make sense of must be kept, not dropped.** An unknown
 *    code is not an error on our side and not one the sender can fix by
 *    retrying, so it is stored with an outcome and forgotten about. When a
 *    partner writes in asking why their client is missing, the answer is one
 *    query away.
 *
 * 3. **Applying an event is all or nothing.** Creating a commission and marking
 *    the referral active are one transaction; a half-applied charge is a
 *    number nobody can reconcile.
 */

/* ---------------------------------------------------------------------------
   The wire format
--------------------------------------------------------------------------- */

export type AffiliateEventType =
  | "referral.linked"
  | "subscription.activated"
  | "subscription.cancelled"
  | "charge.succeeded"
  | "charge.refunded";

/**
 * One event as the Growsearch app sends it.
 *
 * `id` is the sender's own idempotency key and must be stable across retries of
 * the *same* occurrence — a UUID minted when the event is first queued, not one
 * generated per HTTP attempt.
 */
export type AffiliateEvent = {
  id: string;
  type: AffiliateEventType;
  /** The myshopify host. Normalised here; the sender need not be careful. */
  shop: string;
  /** Required on `referral.linked`, ignored everywhere else. */
  code?: string;
  shopName?: string;
  plan?: string;
  /** Required on the charge events: the app's own id for the charge. */
  chargeId?: string;
  /** What the store paid, in minor units. Never a decimal. */
  amountCents?: number;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
  occurredAt?: string;
};

/**
 * What happened, in a word, mirroring `affiliate.event.outcome`.
 *
 * `duplicate` means the event had been seen before and nothing was re-applied,
 * which is a success from the sender's point of view — it gets a 200 and stops
 * retrying, which is the entire point.
 */
export type IngestOutcome =
  | { status: "applied"; detail: string }
  | { status: "ignored"; detail: string }
  | { status: "duplicate"; detail: string };

export class InvalidEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEventError";
  }
}

/* ---------------------------------------------------------------------------
   Validation
--------------------------------------------------------------------------- */

const TYPES: readonly AffiliateEventType[] = [
  "referral.linked",
  "subscription.activated",
  "subscription.cancelled",
  "charge.succeeded",
  "charge.refunded",
];

/**
 * Parses one item of an untrusted request body.
 *
 * Strict rather than forgiving. This endpoint is authenticated by a shared
 * secret, so anything malformed arriving here is a bug in a system we control,
 * and the useful response is a specific complaint that names the field — not a
 * coerced value that turns a missing amount into a £0 commission.
 */
export function parseEvent(input: unknown): AffiliateEvent {
  if (typeof input !== "object" || input === null) {
    throw new InvalidEventError("event must be an object");
  }
  const raw = input as Record<string, unknown>;

  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id || id.length > 200) throw new InvalidEventError("`id` must be a non-empty string");

  const type = raw.type as AffiliateEventType;
  if (!TYPES.includes(type)) {
    throw new InvalidEventError(`\`type\` must be one of ${TYPES.join(", ")}`);
  }

  if (typeof raw.shop !== "string") throw new InvalidEventError("`shop` must be a string");
  const shop = normaliseStoreInput(raw.shop);
  if (!shop) throw new InvalidEventError(`\`shop\` is not a usable host: ${raw.shop.slice(0, 80)}`);

  const event: AffiliateEvent = { id, type, shop };

  if (type === "referral.linked") {
    if (typeof raw.code !== "string") throw new InvalidEventError("`code` is required on referral.linked");
    const code = normaliseCode(raw.code);
    if (!code) throw new InvalidEventError("`code` is not a usable affiliate code");
    event.code = code;
  }

  if (type === "charge.succeeded" || type === "charge.refunded") {
    if (typeof raw.chargeId !== "string" || !raw.chargeId.trim()) {
      throw new InvalidEventError("`chargeId` is required on charge events");
    }
    event.chargeId = raw.chargeId.trim().slice(0, 200);
  }

  if (type === "charge.succeeded") {
    /* Integer minor units, and the check is deliberately unforgiving: a sender
       that has `19.99` where it should have `1999` would otherwise credit an
       agency nineteen cents and nobody would notice for months. */
    if (!Number.isInteger(raw.amountCents) || (raw.amountCents as number) < 0) {
      throw new InvalidEventError("`amountCents` must be a non-negative integer of minor units");
    }
    event.amountCents = raw.amountCents as number;

    if (typeof raw.currency !== "string" || !/^[A-Za-z]{3}$/.test(raw.currency)) {
      throw new InvalidEventError("`currency` must be a three-letter code");
    }
    event.currency = raw.currency.toUpperCase();

    event.periodStart = optionalDate(raw.periodStart, "periodStart");
    event.periodEnd = optionalDate(raw.periodEnd, "periodEnd");
  }

  if (typeof raw.shopName === "string" && raw.shopName.trim()) {
    event.shopName = raw.shopName.trim().slice(0, 200);
  }
  if (typeof raw.plan === "string" && raw.plan.trim()) {
    event.plan = raw.plan.trim().slice(0, 80);
  }
  event.occurredAt = optionalDate(raw.occurredAt, "occurredAt");

  return event;
}

function optionalDate(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new InvalidEventError(`\`${field}\` must be an ISO 8601 timestamp`);
  }
  return value;
}

/* ---------------------------------------------------------------------------
   Applying
--------------------------------------------------------------------------- */

function sql(): Sql {
  const client = db();
  if (!client) {
    throw new Error("DATABASE_URL is not set — affiliate events cannot be recorded.");
  }
  return client;
}

/**
 * Records an event and applies it, once.
 *
 * The whole thing is one transaction, and the event row is written *first*.
 * That ordering is what makes the idempotency real: if the insert conflicts,
 * this delivery is a replay and the function returns without touching money;
 * if the work below then fails, the transaction takes the event row with it and
 * the sender's retry gets a genuine second attempt rather than being told it
 * already succeeded.
 */
export async function ingest(event: AffiliateEvent): Promise<IngestOutcome> {
  return sql().begin(async (tx) => {
    const claimed = await tx`
      insert into affiliate.event (external_id, type, shop, payload)
      values (${event.id}, ${event.type}, ${event.shop}, ${JSON.stringify(event)}::jsonb)
      on conflict (external_id) do nothing
      returning id
    `;

    if (claimed.length === 0) {
      const seen = await tx<{ outcome: string | null }[]>`
        select outcome from affiliate.event where external_id = ${event.id}
      `;
      return {
        status: "duplicate" as const,
        detail: seen[0]?.outcome ?? "already received",
      };
    }

    const outcome = await apply(tx, event);

    await tx`
      update affiliate.event
      set outcome = ${`${outcome.status}:${outcome.detail}`.slice(0, 200)},
          processed_at = now()
      where external_id = ${event.id}
    `;

    return outcome;
  });
}

type ReferralContext = {
  referralId: number;
  partnerId: number;
  partnerKind: PartnerKind;
  partnerStatus: PartnerStatus;
  rateBps: number;
  cancelled: boolean;
  /** When the store churned, so a charge can be judged against its own date. */
  cancelledAt: Date | null;
  hasEarned: boolean;
};

/**
 * The store this event is about, with everything needed to price a charge for
 * it, or null if we have never been told which partner it belongs to.
 *
 * `for update` on the referral is what stops two charges for the same store
 * arriving at once from both passing the "has this influencer been paid yet?"
 * check. The unique index in the migration would catch it anyway — one of the
 * two inserts would fail — but a lock turns a 500 and a retry loop into the
 * second charge simply being recorded as `already_paid_once`.
 */
async function loadReferral(
  tx: TransactionSql,
  shop: string,
): Promise<ReferralContext | null> {
  const rows = await tx<
    {
      id: string;
      partner_id: string;
      kind: PartnerKind;
      status: PartnerStatus;
      commission_rate_bps: number;
      referral_status: string;
      cancelled_at: Date | null;
    }[]
  >`
    select r.id,
           r.partner_id,
           p.kind,
           p.status,
           p.commission_rate_bps,
           r.status as referral_status,
           r.cancelled_at
    from affiliate.referral r
    join affiliate.partner p on p.id = r.partner_id
    where r.shop = ${shop}
    for update of r
  `;

  if (rows.length === 0) return null;
  const row = rows[0];

  /* Counted in its own statement rather than as a subquery in the one above.
     Postgres refuses FOR UPDATE on a query containing aggregates, and this side
     of the lock is where the count has to be read anyway — the row is held for
     the rest of the transaction, so nothing can add a commission between the
     two statements. */
  const earned = await tx`
    select 1 from affiliate.commission
    where referral_id = ${Number(row.id)} and status <> 'reversed'
    limit 1
  `;

  return {
    referralId: Number(row.id),
    partnerId: Number(row.partner_id),
    partnerKind: row.kind,
    partnerStatus: row.status,
    rateBps: row.commission_rate_bps,
    cancelled: row.referral_status === "cancelled",
    cancelledAt: row.cancelled_at,
    hasEarned: earned.length > 0,
  };
}

/**
 * Whether the store had already churned when this charge was collected.
 *
 * `cancelled` on its own is the state *now*, which is the wrong question for a
 * charge being replayed months after the fact: a store that paid in March and
 * churned in June earned its partner the March commission, and reading the
 * June status would quietly withhold it. That is exactly what
 * `replaySkippedCharges` does on approval, which is where this was losing
 * money.
 *
 * A cancelled referral with no `cancelled_at` cannot be placed in time, so it
 * counts as cancelled throughout — the conservative reading, and one
 * `setReferralStatus` makes unreachable anyway by always stamping the column.
 */
function cancelledByCharge(referral: ReferralContext, chargeAt: Date): boolean {
  if (!referral.cancelled) return false;
  if (!referral.cancelledAt) return true;
  return referral.cancelledAt.getTime() <= chargeAt.getTime();
}

/**
 * Whether this charge has already been refunded.
 *
 * The refund may well have arrived when there was no commission to reverse: a
 * charge collected while the partner's application was pending earns nothing,
 * so `chargeRefunded` below finds no row and records `no_commission_for_charge`.
 * From then on the event log is the only record that the money went back,
 * which makes it the thing to consult before paying on that charge later.
 *
 * Narrowed by `shop` so this rides `event_shop_idx` instead of scanning every
 * event ever received for a JSON key.
 *
 * The `jsonb_typeof` dance is not decoration. `ingest` writes the payload as
 * `${JSON.stringify(event)}::jsonb`, and postgres.js JSON-encodes a string
 * bound to a jsonb parameter — so the column holds a jsonb *string* wrapping
 * the real object, and a plain `payload->>'chargeId'` silently returns null on
 * every row. (The same quirk is why `replaySkippedCharges` parses the column
 * with `json()` rather than spreading it.) Unwrapping one level when the value
 * is a string leaves this correct against the rows written today and against
 * properly-encoded rows if that is ever fixed.
 */
async function chargeWasRefunded(
  tx: TransactionSql,
  shop: string,
  chargeId: string,
): Promise<boolean> {
  const refunds = await tx`
    select 1 from affiliate.event
    where shop = ${shop}
      and type = 'charge.refunded'
      and (case when jsonb_typeof(payload) = 'string'
                then (payload #>> '{}')::jsonb
                else payload end) ->> 'chargeId' = ${chargeId}
    limit 1
  `;
  return refunds.length > 0;
}

async function apply(tx: TransactionSql, event: AffiliateEvent): Promise<IngestOutcome> {
  switch (event.type) {
    case "referral.linked":
      return linkReferral(tx, event);
    case "subscription.activated":
      return setReferralStatus(tx, event, "active");
    case "subscription.cancelled":
      return setReferralStatus(tx, event, "cancelled");
    case "charge.succeeded":
      return chargeSucceeded(tx, event);
    case "charge.refunded":
      return chargeRefunded(tx, event);
  }
}

/**
 * Attributes a store to the partner who owns the code the merchant entered.
 *
 * First code wins, permanently. `affiliate.referral.shop` is unique, so a store
 * that already belongs to somebody cannot be moved by entering a second code —
 * the insert conflicts and this reports it. That is a commercial decision as
 * much as a technical one: the alternative, last-write-wins, means an agency's
 * client can be taken by anyone who talks the merchant into retyping a field.
 */
async function linkReferral(tx: TransactionSql, event: AffiliateEvent): Promise<IngestOutcome> {
  const codes = await tx<{ id: string; partner_id: string; active: boolean }[]>`
    select id, partner_id, active from affiliate.code where code = ${event.code!}
  `;

  if (codes.length === 0) return { status: "ignored", detail: "unknown_code" };
  if (!codes[0].active) return { status: "ignored", detail: "retired_code" };

  const inserted = await tx`
    insert into affiliate.referral (partner_id, code_id, shop, shop_name)
    values (${Number(codes[0].partner_id)}, ${Number(codes[0].id)}, ${event.shop}, ${
      event.shopName ?? null
    })
    on conflict (shop) do nothing
    returning id
  `;

  if (inserted.length === 0) {
    /* Already attributed — possibly to this same partner, if the merchant
       re-entered the code they already had. Either way nothing moves. */
    return { status: "ignored", detail: "shop_already_referred" };
  }

  return { status: "applied", detail: "referral_linked" };
}

async function setReferralStatus(
  tx: TransactionSql,
  event: AffiliateEvent,
  status: "active" | "cancelled",
): Promise<IngestOutcome> {
  /* `coalesce(existing, now())` rather than an unconditional `now()`: these
     events can arrive out of order, and a subscription.activated replayed after
     a charge already marked the store live must not move the activation date
     forward past the money it explains. */
  const updated = await tx`
    update affiliate.referral
    set status = ${status},
        plan = coalesce(${event.plan ?? null}, plan),
        shop_name = coalesce(${event.shopName ?? null}, shop_name),
        activated_at = case when ${status} = 'active'
                            then coalesce(activated_at, now())
                            else activated_at end,
        cancelled_at = case when ${status} = 'cancelled'
                            then coalesce(cancelled_at, now())
                            else cancelled_at end,
        last_event_at = now()
    where shop = ${event.shop}
    returning id
  `;
  return updated.length > 0
    ? { status: "applied", detail: `referral_${status}` }
    : { status: "ignored", detail: "unknown_shop" };
}

/**
 * The event that produces money.
 *
 * The decision itself is in `commission.ts` and is pure; everything here is
 * fetching what it needs and writing down what it said. A charge that earns
 * nothing is still a success — an influencer's referral paying its second month
 * is *supposed* to earn nothing — so the reason is recorded against the event
 * and the sender gets a 200.
 */
async function chargeSucceeded(tx: TransactionSql, event: AffiliateEvent): Promise<IngestOutcome> {
  const referral = await loadReferral(tx, event.shop);
  if (!referral) return { status: "ignored", detail: "unknown_shop" };

  /* A store that pays is a store that is live, whatever order the events
     arrived in. Doing this before the commission means a charge that arrives
     before its subscription.activated still leaves the dashboard correct. */
  await tx`
    update affiliate.referral
    set status = case when status = 'cancelled' then status else 'active' end,
        activated_at = coalesce(activated_at, now()),
        last_event_at = now()
    where id = ${referral.referralId}
  `;

  /* The charge's own moment, not this request's. A replayed charge is months
     old by the time it gets here, and both the cancellation question and the
     record of a refund have to be asked as of then. An unparseable or absent
     timestamp falls back to now, which is what a live charge means anyway. */
  const stamped = event.occurredAt ? new Date(event.occurredAt) : null;
  const chargeAt = stamped && !Number.isNaN(stamped.getTime()) ? stamped : new Date();

  const decision = applyCharge({
    partnerKind: referral.partnerKind,
    partnerStatus: referral.partnerStatus,
    rateBps: referral.rateBps,
    chargeCents: event.amountCents!,
    referralHasEarned: referral.hasEarned,
    referralCancelled: cancelledByCharge(referral, chargeAt),
    chargeRefunded: await chargeWasRefunded(tx, event.shop, event.chargeId!),
  });

  if (!decision.earns) return { status: "ignored", detail: decision.reason };

  const inserted = await tx`
    insert into affiliate.commission
      (partner_id, referral_id, kind, amount_cents, currency, charge_cents, rate_bps,
       period_start, period_end, charge_ref)
    values
      (${referral.partnerId}, ${referral.referralId}, ${decision.kind},
       ${decision.amountCents}, ${event.currency!}, ${event.amountCents!}, ${decision.rateBps},
       ${event.periodStart ?? null}, ${event.periodEnd ?? null}, ${event.chargeId!})
    on conflict (charge_ref) do nothing
    returning id
  `;

  if (inserted.length === 0) {
    /* The same charge under a different event id — the sender re-queued rather
       than retried. The `charge_ref` index is the backstop described at the top
       of this file, and this is it doing its job. */
    return { status: "ignored", detail: "charge_already_credited" };
  }

  return { status: "applied", detail: `commission_${decision.amountCents}` };
}

/**
 * Undoes a commission when the charge behind it is refunded.
 *
 * Reversed, never deleted. The partner has already seen the amount in their
 * dashboard, and a figure that silently shrinks is a support ticket where a
 * visible reversal is an explanation. It also frees the influencer's one-time
 * slot — the partial unique index excludes reversed rows — so a store that
 * refunds and re-subscribes can earn its introduction fee properly.
 *
 * A commission that has already been paid out is left alone. We cannot unpay
 * it, and marking it reversed would make the partner's balance disagree with
 * their bank statement; recovering it is a conversation, not an UPDATE.
 */
async function chargeRefunded(tx: TransactionSql, event: AffiliateEvent): Promise<IngestOutcome> {
  const reversed = await tx`
    update affiliate.commission
    set status = 'reversed', reversed_at = now()
    where charge_ref = ${event.chargeId!}
      and status in ('pending', 'approved')
    returning id
  `;

  if (reversed.length > 0) return { status: "applied", detail: "commission_reversed" };

  const paid = await tx`
    select 1 from affiliate.commission
    where charge_ref = ${event.chargeId!} and status = 'paid'
  `;
  return paid.length > 0
    ? { status: "ignored", detail: "already_paid_out" }
    : { status: "ignored", detail: "no_commission_for_charge" };
}

/* ---------------------------------------------------------------------------
   Maintenance
--------------------------------------------------------------------------- */

/**
 * Moves commissions out of the refund window and into what a partner is owed.
 *
 * One statement, and it is safe to run as often as you like — the WHERE clause
 * is the whole condition, so a second run in the same minute updates nothing.
 * It is called at the top of every ingest request, which in a healthy month
 * means it runs several times a day for free. A quiet month is the case that
 * needs a nightly cron against `/api/affiliate/events` — see `docs/affiliate.md`
 * — because a partner whose last referral churned in January should still see
 * their December commissions clear.
 *
 * Returns how many cleared, so the log line is worth reading.
 */
export async function clearMaturedCommissions(): Promise<number> {
  const cleared = await sql()`
    update affiliate.commission
    set status = 'approved', cleared_at = now()
    where status = 'pending'
      and created_at < now() - ${`${HOLD_DAYS} days`}::interval
    returning id
  `;
  return cleared.length;
}
