/**
 * What an affiliate earns, and when they can have it.
 *
 * This file is the whole commercial rule of the program, deliberately kept
 * free of the database and of React so it can be read in one sitting and
 * argued about by someone who does not write TypeScript:
 *
 *   An **agency** installs Growsearch for its clients and keeps looking after
 *   them, so it earns on every charge a referred store pays, for as long as
 *   that store stays subscribed. Recurring.
 *
 *   An **influencer** made one introduction. They earn once, on the first
 *   charge the store they brought actually pays. One-time.
 *
 * `applyCharge` below is the single place that decides whether a given charge
 * produces a commission. Everything else — the route handler, the ingest, the
 * dashboard — reads its answer rather than re-deriving the rule.
 */

import type { CommissionKind, PartnerKind, PartnerStatus } from "./types";

/**
 * The rates a new partner is created with, in basis points.
 *
 * PLACEHOLDER — these have not been signed off commercially. They are the
 * shape of the thing, not the numbers: the influencer rate is higher because
 * it is paid once, the agency rate lower because it is paid every month for
 * the life of the account, which is worth far more over any store that stays.
 *
 * Changing them here only affects partners created afterwards. The rate is
 * copied onto `affiliate.partner.commission_rate_bps` at sign-up and every
 * calculation reads it from the row, so an existing partner's terms cannot be
 * altered by a deploy — which is the correct behaviour for a number somebody
 * agreed to.
 */
export const DEFAULT_RATE_BPS: Record<PartnerKind, number> = {
  agency: 2000, // 20% of every charge, for as long as the store subscribes
  influencer: 3000, // 30% of the first charge, once
};

/**
 * Which rule a partner is on. The mapping is one-to-one today, but the two
 * concepts are genuinely separate — `kind` is who the partner is, `kind` on a
 * commission is how that particular row was calculated — and a negotiated
 * recurring deal for an influencer would change this function and nothing else.
 */
export function commissionKindFor(partner: PartnerKind): CommissionKind {
  return partner === "agency" ? "recurring" : "one_time";
}

/**
 * How long a commission sits in `pending` before it is owed.
 *
 * It covers the window in which the underlying charge can still be refunded or
 * charged back. Paying inside it means clawing money back from someone who has
 * already spent it, which costs more in goodwill than the float is worth.
 */
export const HOLD_DAYS = 30;

/** When a commission created now becomes withdrawable. */
export function clearsAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + HOLD_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * The commission on one charge, in the charge's own minor units.
 *
 * Rounded half-up to the minor unit, because a fraction of a cent cannot be
 * paid and rounding down every month is a quiet discount off an agreed rate.
 * The rounding error is at most one cent per charge and it favours the partner,
 * which is the right direction for an error nobody will audit.
 */
export function commissionCents(chargeCents: number, rateBps: number): number {
  if (!Number.isFinite(chargeCents) || chargeCents <= 0) return 0;
  return Math.round((chargeCents * rateBps) / 10_000);
}

/**
 * Why a charge earned nothing. These are not errors — a store's second month
 * on an influencer's referral is *supposed* to earn nothing — so they are
 * recorded against the event and shown in the ingest log rather than raised.
 */
export type SkipReason =
  | "already_paid_once" // influencer rule: this referral has earned its fee
  | "charge_refunded" // the money went back; there is nothing left to pay on
  | "partner_not_approved" // application is pending, rejected or suspended
  | "referral_cancelled" // the store had already churned when this charge landed
  | "zero_amount"; // a £0 charge, e.g. a fully discounted month

export type ChargeDecision =
  | { earns: true; kind: CommissionKind; amountCents: number; rateBps: number }
  | { earns: false; reason: SkipReason };

/**
 * Whether one charge produces a commission, and for how much.
 *
 * Pure: everything it needs is an argument, so the interesting cases — an
 * influencer's second charge, a suspended agency, a refunded month — can be
 * checked without a database.
 *
 * The order of the guards is the order of the questions a human would ask, and
 * it matters for the reason recorded: a suspended partner whose referral also
 * churned is reported as suspended, because that is the fact somebody needs to
 * act on. The one exception is the refund, which is asked before anything else
 * — the reason recorded there decides whether the charge is ever reconsidered.
 */
export function applyCharge(input: {
  partnerKind: PartnerKind;
  partnerStatus: PartnerStatus;
  rateBps: number;
  chargeCents: number;
  /** Whether this referral has already produced a live one-time commission. */
  referralHasEarned: boolean;
  /**
   * Whether the store had cancelled **by the time of this charge** — not
   * whether it has cancelled by now. Money collected while a store was
   * subscribed was earned, and a cancellation three months later does not
   * unearn it. The caller resolves this against the charge's own timestamp;
   * see `chargeSucceeded` in `ingest.ts`.
   */
  referralCancelled: boolean;
  /**
   * Whether this exact charge has been refunded.
   *
   * Needed because a charge can be refunded before it has ever produced a
   * commission: one collected while the partner's application was still
   * pending earns nothing at the time, so the refund that follows finds no
   * commission to reverse and only the event log remembers it.
   */
  chargeRefunded: boolean;
}): ChargeDecision {
  /* Asked first because it is a fact about the money rather than about the
     relationship: refunded money cannot be commissioned whoever the partner is
     and whatever state their application is in. Answering `partner_not_approved`
     here instead would file the charge in the queue `replaySkippedCharges`
     drains on approval — and pay it in full. */
  if (input.chargeRefunded) {
    return { earns: false, reason: "charge_refunded" };
  }
  if (input.partnerStatus !== "approved") {
    return { earns: false, reason: "partner_not_approved" };
  }
  if (input.referralCancelled) {
    return { earns: false, reason: "referral_cancelled" };
  }
  if (input.chargeCents <= 0) {
    return { earns: false, reason: "zero_amount" };
  }

  const kind = commissionKindFor(input.partnerKind);

  /* The influencer rule. Checked here as well as by the partial unique index
     in the migration: the index is what makes a double payment impossible, and
     this is what makes it a recorded decision rather than a caught exception. */
  if (kind === "one_time" && input.referralHasEarned) {
    return { earns: false, reason: "already_paid_once" };
  }

  return {
    earns: true,
    kind,
    rateBps: input.rateBps,
    amountCents: commissionCents(input.chargeCents, input.rateBps),
  };
}

/** The rate as a percentage, for display. `2000` reads as `20%`, `1550` as `15.5%`. */
export function formatRate(bps: number): string {
  const percent = bps / 100;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2).replace(/0$/, "")}%`;
}

/** One line describing what a partner earns, used on the dashboard and in email. */
export function describeTerms(kind: PartnerKind, rateBps: number): string {
  return kind === "agency"
    ? `${formatRate(rateBps)} of every payment, for as long as the store stays subscribed.`
    : `${formatRate(rateBps)} of the first payment from every store you bring.`;
}
