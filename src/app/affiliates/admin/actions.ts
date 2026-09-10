"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/affiliate/admin";
import {
  recordPayout,
  replaySkippedCharges,
  setCommissionRate,
  setPartnerStatus,
} from "@/lib/affiliate/admin-store";
import { formatMoney } from "@/lib/affiliate/format";
import type { PartnerStatus, PayoutMethod } from "@/lib/affiliate/types";

/**
 * Everything an admin can change.
 *
 * **Every function here calls `requireAdmin()` first, with no exceptions.** A
 * Server Action is a public POST endpoint — it is reachable by anyone who can
 * read the action id out of the page bundle, whether or not they were ever
 * served the form. The admin layout having checked is not a defence, because
 * nothing guarantees the layout ran for the request that reaches this file.
 *
 * These take a `partnerId` from the form, which the partner-facing actions
 * deliberately never do. That is the point of an admin action — it acts on
 * somebody else's account — and it is precisely why the gate above it has to
 * be real rather than a redirect somewhere else in the tree.
 */

export type FormState = { error?: string; notice?: string } | undefined;

/** A positive integer from a form field, or null if it is anything else. */
function id(form: FormData, field: string): number | null {
  const raw = form.get(field);
  const n = typeof raw === "string" ? Number(raw) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

function text(form: FormData, field: string, max = 200): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const STATUSES: readonly PartnerStatus[] = ["pending", "approved", "rejected", "suspended"];
const METHODS: readonly PayoutMethod[] = ["bank", "paypal", "wise", "other"];

/**
 * Approve, reject, suspend or return an application to the queue.
 *
 * Approving is the interesting one. `applyCharge` refuses to write a commission
 * for a partner who is not yet approved, so any charge that arrived while this
 * application sat in the queue earned nothing and lives only in the event log.
 * Approving replays those, which is the difference between a partner's first
 * month being paid and being quietly lost — see `replaySkippedCharges`.
 */
export async function updateStatus(_state: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const partnerId = id(form, "partnerId");
  const status = text(form, "status") as PartnerStatus;

  if (!partnerId) return { error: "Which partner?" };
  if (!STATUSES.includes(status)) return { error: `${status || "That"} is not a partner status.` };

  await setPartnerStatus(partnerId, status);

  let notice = `Marked ${status}.`;
  if (status === "approved") {
    const { replayed, earned } = await replaySkippedCharges(partnerId);
    if (replayed > 0) {
      notice +=
        earned > 0
          ? ` Replayed ${replayed} charge${replayed === 1 ? "" : "s"} that arrived while the application was pending; ${earned} earned commission.`
          : ` Replayed ${replayed} held charge${replayed === 1 ? "" : "s"}; none earned — check the ledger.`;
    }
  }

  revalidateAdmin(partnerId);
  return { notice };
}

/**
 * Change a partner's rate.
 *
 * Taken as a percentage because that is what was negotiated and what the
 * partner will quote back; stored as basis points because a percentage held as
 * a float is a rounding argument waiting to happen. One decimal place is
 * allowed — 17.5% is a real number somebody agrees to, 17.53% is a typo.
 */
export async function updateRate(_state: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const partnerId = id(form, "partnerId");
  if (!partnerId) return { error: "Which partner?" };

  const raw = text(form, "percent", 10);
  const percent = Number(raw);
  if (!raw || !Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { error: "Enter a rate between 0 and 100 percent." };
  }

  const bps = Math.round(percent * 100);
  if (Math.abs(percent * 100 - bps) > 1e-9) {
    return { error: "One decimal place at most — 17.5% is fine, 17.53% is not." };
  }

  await setCommissionRate(partnerId, bps);

  revalidateAdmin(partnerId);
  return {
    notice: `Now ${percent}% on everything earned from here. Commissions already recorded keep the rate they were calculated at.`,
  };
}

/**
 * Record a payment that has already left our bank.
 *
 * The admin never types an amount: `expectedCents` is what the page showed them
 * and the store settles exactly the commissions behind it, or refuses. So this
 * form cannot create a payout that disagrees with the ledger — the worst it can
 * do is fail and say why.
 */
export async function createPayout(_state: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const partnerId = id(form, "partnerId");
  const currency = text(form, "currency", 8).toUpperCase();
  const method = text(form, "method") as PayoutMethod;
  const expectedCents = Number(form.get("expectedCents"));

  if (!partnerId) return { error: "Which partner?" };
  if (!currency) return { error: "Which currency?" };
  if (!METHODS.includes(method)) return { error: "Choose how this was paid." };
  if (!Number.isInteger(expectedCents) || expectedCents <= 0) {
    return { error: "That page is stale — reload it and try again." };
  }

  /* Not required, and deliberately so. The reference is whatever the bank
     called the transfer, and an admin who has just made a payment and does not
     yet have the reference should still be able to record it before they forget
     — an unreferenced payout in the ledger beats a payment nobody wrote down. */
  const reference = text(form, "reference", 120) || null;
  const note = text(form, "note", 400) || null;

  const result = await recordPayout({
    partnerId,
    currency,
    method,
    reference,
    note,
    expectedCents,
  });

  if (!result.ok) {
    if (result.reason === "nothing_owed") {
      return {
        error:
          "Nothing is owed in that currency any more — somebody may have recorded this payout already. Reload before trying again.",
      };
    }
    return {
      error: `The amount owed moved to ${formatMoney(result.actualCents, currency)} while this form was open — commissions cleared the refund window. Reload and check the figure before recording it.`,
    };
  }

  revalidateAdmin(partnerId);
  return {
    notice: `Recorded ${formatMoney(result.amountCents, currency)}, settling ${result.commissionCount} commission${result.commissionCount === 1 ? "" : "s"}.`,
  };
}

/** Replay held charges without changing status — for a partner approved before this existed. */
export async function replayHeld(_state: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const partnerId = id(form, "partnerId");
  if (!partnerId) return { error: "Which partner?" };

  const { replayed, earned } = await replaySkippedCharges(partnerId);
  revalidateAdmin(partnerId);

  if (replayed === 0) return { notice: "No held charges to replay." };
  return {
    notice: `Replayed ${replayed} charge${replayed === 1 ? "" : "s"}; ${earned} earned commission.`,
  };
}

/**
 * Both admin views of a partner, plus the partner's own dashboard.
 *
 * That last one matters: approving somebody changes what their dashboard says
 * about their own money, and leaving them looking at a cached "awaiting
 * approval" banner is how a support email starts.
 */
function revalidateAdmin(partnerId: number) {
  revalidatePath("/affiliates/admin");
  revalidatePath("/affiliates/admin/partners");
  revalidatePath(`/affiliates/admin/partners/${partnerId}`);
  revalidatePath("/affiliates/admin/payouts");
  revalidatePath("/affiliates/dashboard", "layout");
}
