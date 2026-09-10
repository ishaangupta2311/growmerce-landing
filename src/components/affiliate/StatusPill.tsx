import type { CommissionStatus, PartnerStatus, ReferralStatus } from "@/lib/affiliate/types";

/**
 * The small coloured word beside a row.
 *
 * Colour is never the only signal — each state has its own word, and the words
 * are chosen to be readable without the legend: a referral is "not yet paying"
 * rather than "linked", a commission is "clearing" rather than "pending". The
 * database's vocabulary is for the database.
 */

const TONE = {
  good: "bg-brand/10 text-brand ring-brand/25",
  quiet: "bg-cream text-body-mute ring-line",
  warn: "bg-peach text-charcoal ring-brand/20",
  gone: "bg-white text-muted ring-line line-through decoration-muted/60",
} as const;

type Tone = keyof typeof TONE;

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-poppins text-[12.5px] font-bold whitespace-nowrap ring-1 ring-inset ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

const REFERRAL: Record<ReferralStatus, { tone: Tone; label: string }> = {
  linked: { tone: "quiet", label: "Not yet paying" },
  trialing: { tone: "warn", label: "On trial" },
  active: { tone: "good", label: "Subscribed" },
  cancelled: { tone: "gone", label: "Cancelled" },
};

export function ReferralPill({ status }: { status: ReferralStatus }) {
  return <Pill tone={REFERRAL[status].tone}>{REFERRAL[status].label}</Pill>;
}

const COMMISSION: Record<CommissionStatus, { tone: Tone; label: string }> = {
  pending: { tone: "warn", label: "Clearing" },
  approved: { tone: "good", label: "Owed to you" },
  paid: { tone: "quiet", label: "Paid" },
  reversed: { tone: "gone", label: "Reversed" },
};

export function CommissionPill({ status }: { status: CommissionStatus }) {
  return <Pill tone={COMMISSION[status].tone}>{COMMISSION[status].label}</Pill>;
}

const PARTNER: Record<PartnerStatus, { tone: Tone; label: string }> = {
  pending: { tone: "warn", label: "Awaiting approval" },
  approved: { tone: "good", label: "Approved" },
  rejected: { tone: "gone", label: "Not approved" },
  suspended: { tone: "gone", label: "Suspended" },
};

export function PartnerPill({ status }: { status: PartnerStatus }) {
  return <Pill tone={PARTNER[status].tone}>{PARTNER[status].label}</Pill>;
}
