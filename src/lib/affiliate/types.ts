/**
 * The shapes the affiliate program is described in.
 *
 * These mirror `migrations/0002_affiliate.sql` column for column, with two
 * deliberate differences: money is `number` of minor units (never a float of
 * major ones), and timestamps are `Date`, because postgres.js hands back Date
 * objects and re-parsing strings at every call site is how time zones get lost.
 *
 * Nothing here is a database row as it comes out of Postgres — every query in
 * `store.ts` maps into these, so a column rename is a compile error rather
 * than an undefined rendered into the page.
 */

/**
 * Which of the two programs a partner is on. This decides how they are paid,
 * not merely how they are labelled — see `commission.ts`.
 */
export type PartnerKind = "agency" | "influencer";

/**
 * Where an application has got to. `pending` partners can log in and copy
 * their code; what they cannot do is have commissions clear.
 */
export type PartnerStatus = "pending" | "approved" | "rejected" | "suspended";

export type PayoutMethod = "bank" | "paypal" | "wise" | "other";

export type Partner = {
  id: number;
  userId: string;
  kind: PartnerKind;
  name: string;
  company: string;
  email: string;
  website: string | null;
  status: PartnerStatus;
  /** Basis points. 2000 is 20%. */
  commissionRateBps: number;
  payoutMethod: PayoutMethod | null;
  payoutDetails: string | null;
  payoutCurrency: string;
  approvedAt: Date | null;
  createdAt: Date;
};

export type AffiliateCode = {
  id: number;
  code: string;
  label: string | null;
  active: boolean;
  createdAt: Date;
  /** How many stores have been attributed to this code. */
  referralCount: number;
};

/**
 * A referred store's lifecycle. `linked` means the code was entered but the
 * store is not paying yet — which is the state most referrals sit in for their
 * first two weeks, and the reason the dashboard counts it separately from
 * anything that has earned money.
 */
export type ReferralStatus = "linked" | "trialing" | "active" | "cancelled";

export type Referral = {
  id: number;
  shop: string;
  shopName: string | null;
  status: ReferralStatus;
  plan: string | null;
  code: string;
  linkedAt: Date;
  activatedAt: Date | null;
  cancelledAt: Date | null;
  /** Everything this store has ever earned the partner, minor units. */
  earnedCents: number;
  currency: string;
};

export type CommissionKind = "one_time" | "recurring";

/**
 * `pending` is inside the refund window, `approved` is owed, `paid` is settled,
 * `reversed` is a correction. A partner's "available balance" is the sum of
 * `approved` alone — see `ledger.ts`.
 */
export type CommissionStatus = "pending" | "approved" | "paid" | "reversed";

export type Commission = {
  id: number;
  kind: CommissionKind;
  amountCents: number;
  currency: string;
  chargeCents: number;
  rateBps: number;
  status: CommissionStatus;
  shop: string;
  shopName: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  createdAt: Date;
  clearedAt: Date | null;
};

export type Payout = {
  id: number;
  amountCents: number;
  currency: string;
  method: PayoutMethod;
  reference: string | null;
  note: string | null;
  paidAt: Date;
  /** How many commission rows this payout settled. */
  commissionCount: number;
};

/**
 * The four numbers at the top of the dashboard, in one currency.
 *
 * They are kept apart rather than rolled into one "earnings" figure because
 * they answer different questions, and a partner who is told one number will
 * assume it is the one they can withdraw:
 *
 *   pending    earned, still inside the refund window
 *   approved   cleared and owed — this is the withdrawable balance
 *   paid       already sent
 *   lifetime   pending + approved + paid, i.e. everything ever earned
 *
 * `reversed` is in none of them. It is visible on the row it belongs to and
 * nowhere else, because a reversal is not a kind of earning.
 */
export type Totals = {
  currency: string;
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  lifetimeCents: number;
};

/** Everything the overview page needs, in one round trip. */
export type DashboardSummary = {
  totals: Totals;
  /** Totals in any other currency, so a mixed ledger is not silently hidden. */
  otherCurrencies: Totals[];
  /**
   * The four statuses a referral can be in, and they add up to `total`. The
   * overview prints them as a note under that total, so a bucket that is
   * missing or folded into another one is arithmetic a partner can catch.
   */
  referrals: {
    total: number;
    /** Paying — `active` alone, with trials counted separately below. */
    active: number;
    /** On a trial: further along than `linked`, not yet earning anything. */
    trialing: number;
    /** Attributed but not yet paying — the pipeline. */
    linked: number;
    cancelled: number;
  };
  /** The most recent commissions, newest first. */
  recentCommissions: Commission[];
  /** The most recently referred stores, newest first. */
  recentReferrals: Referral[];
};
