import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/affiliate/admin";
import { partnerById, skippedChargeCount } from "@/lib/affiliate/admin-store";
import { describeTerms, formatRate, HOLD_DAYS } from "@/lib/affiliate/commission";
import { formatCode } from "@/lib/affiliate/codes";
import { formatDate, formatMoney } from "@/lib/affiliate/format";
import {
  codesFor,
  commissionCountFor,
  commissionsFor,
  payoutsFor,
  referralCountFor,
  referralsFor,
  totalsFor,
} from "@/lib/affiliate/store";
import Empty from "@/components/affiliate/Empty";
import Panel from "@/components/affiliate/Panel";
import StatCard from "@/components/affiliate/StatCard";
import { CommissionPill, PartnerPill, ReferralPill } from "@/components/affiliate/StatusPill";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";
import {
  RateControls,
  ReplayControls,
  StatusControls,
} from "@/components/affiliate/admin/PartnerControls";

export const metadata: Metadata = { title: "Partner" };

/**
 * One partner, in full.
 *
 * The reads are the partner's own — `totalsFor`, `referralsFor` and friends out
 * of `store.ts`, given an id that came from the URL instead of from a session.
 * That is safe here and only here: `requireAdmin()` above has already decided
 * this person may look at anybody's account, which is the whole distinction
 * between this file and the dashboard that shares its queries.
 */
export default async function AdminPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const partnerId = Number(id);
  if (!Number.isInteger(partnerId) || partnerId <= 0) notFound();

  const partner = await partnerById(partnerId);
  if (!partner) notFound();

  /* The two lists stop at a hundred rows, so the two counts come with them.
     Without them a partner with four hundred stores gets a page that looks
     complete and is not, and the number under the lifetime card is the size of
     a query rather than the size of the account. Counted rather than paginated:
     an admin who needs row 250 has the partner's own dashboard for it. */
  const [totals, codes, referrals, commissions, payouts, held, referralCount, commissionCount] =
    await Promise.all([
      totalsFor(partner.id),
      codesFor(partner.id),
      referralsFor(partner.id, partner.payoutCurrency, 100),
      commissionsFor(partner.id, 100),
      payoutsFor(partner.id),
      skippedChargeCount(partner.id),
      referralCountFor(partner.id),
      commissionCountFor(partner.id),
    ]);

  const headline = totals[0];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/affiliates/admin/partners"
          className="font-poppins text-[14px] font-bold text-brand underline"
        >
          ← All partners
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[clamp(1.4rem,3vw,1.9rem)] leading-tight font-bold">
              {partner.company}
            </h2>
            <p className="mt-1.5 text-[15px] text-body-mute">
              {partner.name} ·{" "}
              <a href={`mailto:${partner.email}`} className="underline hover:text-brand">
                {partner.email}
              </a>
              {partner.website && (
                <>
                  {" · "}
                  <a
                    href={partner.website}
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    className="underline hover:text-brand"
                  >
                    {partner.website.replace(/^https?:\/\//, "")}
                  </a>
                </>
              )}
            </p>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-body-mute">
              {describeTerms(partner.kind, partner.commissionRateBps)} Joined{" "}
              {formatDate(partner.createdAt)}
              {partner.approvedAt && `, approved ${formatDate(partner.approvedAt)}`}.
            </p>
          </div>
          <PartnerPill status={partner.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Owed now"
          value={headline ? formatMoney(headline.approvedCents, headline.currency) : "—"}
          note="Cleared and unpaid."
          emphasis={Boolean(headline?.approvedCents)}
        />
        <StatCard
          label="Clearing"
          value={headline ? formatMoney(headline.pendingCents, headline.currency) : "—"}
          note={`Inside the ${HOLD_DAYS}-day window.`}
        />
        <StatCard
          label="Paid out"
          value={headline ? formatMoney(headline.paidCents, headline.currency) : "—"}
          note={`${payouts.length} payout${payouts.length === 1 ? "" : "s"} recorded.`}
        />
        <StatCard
          label="Lifetime"
          value={headline ? formatMoney(headline.lifetimeCents, headline.currency) : "—"}
          note={`${referralCount} store${referralCount === 1 ? "" : "s"} referred.`}
        />
      </div>

      {totals.length > 1 && (
        <p className="text-[14.5px] leading-relaxed text-body-mute">
          Also earns in{" "}
          {totals
            .slice(1)
            .map((t) => `${t.currency} (${formatMoney(t.approvedCents, t.currency)} owed)`)
            .join(", ")}
          . Each currency is paid separately.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel title="Account status">
          <StatusControls partner={partner} />
        </Panel>
        <Panel title="Commission rate">
          <RateControls partner={partner} />
        </Panel>
      </div>

      {/* Approved partners only. A pending partner's held charges are replayed
          by the approve action itself, so offering the button before then is
          offering a press that re-ingests every one of them into the same
          refusal — no money earned, the queue re-dated, and a synthetic event
          row per charge. `replayHeld` refuses for the same reason. */}
      {partner.status === "approved" && held > 0 && (
        <Panel title="Held charges">
          <ReplayControls partner={partner} held={held} />
        </Panel>
      )}

      <Panel title="How they want to be paid">
        {partner.payoutMethod ? (
          <dl className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
            <dt className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
              Method
            </dt>
            <dd className="text-[16px] text-charcoal capitalize">{partner.payoutMethod}</dd>
            <dt className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
              Details
            </dt>
            <dd className="text-[16px] break-words whitespace-pre-wrap text-charcoal">
              {partner.payoutDetails}
            </dd>
            <dt className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
              Currency
            </dt>
            <dd className="text-[16px] text-charcoal">{partner.payoutCurrency}</dd>
          </dl>
        ) : (
          <p className="text-[15px] leading-relaxed text-body-mute">
            Nothing yet. They fill this in under Settings on their own dashboard,
            and there is nowhere to send money until they do.
          </p>
        )}
      </Panel>

      <Panel title="Codes" scroll={codes.length > 0}>
        {codes.length === 0 ? (
          <Empty title="No codes">
            Every partner gets one at sign-up, so this is a bug worth chasing.
          </Empty>
        ) : (
          <Table caption="Affiliate codes on this account">
            <Head>
              <Th>Code</Th>
              <Th>Label</Th>
              <Th>Created</Th>
              <Th numeric>Stores</Th>
            </Head>
            <Body>
              {codes.map((code) => (
                <Row key={code.id}>
                  <RowHeader>
                    <code className="font-poppins text-[16px] font-bold tracking-[0.04em] text-brand">
                      {formatCode(code.code)}
                    </code>
                    {!code.active && <span className="ml-2 text-[13.5px] text-muted">retired</span>}
                  </RowHeader>
                  <Td>{code.label ?? <span className="text-muted">—</span>}</Td>
                  <Td>{formatDate(code.createdAt)}</Td>
                  <Td numeric>{code.referralCount}</Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>

      <Panel title="Referred stores" scroll={referrals.length > 0}>
        {referrals.length === 0 ? (
          <Empty title="No stores yet">
            Stores appear when a merchant enters this partner&rsquo;s code in
            Growsearch.
          </Empty>
        ) : (
          <>
            <Table caption="Stores attributed to this partner">
              <Head>
                <Th>Store</Th>
                <Th>Status</Th>
                <Th>Code</Th>
                <Th>Linked</Th>
                <Th numeric>Earned</Th>
              </Head>
              <Body>
                {referrals.map((referral) => (
                  <Row key={referral.id}>
                    <RowHeader>
                      <span className="font-bold text-charcoal">
                        {referral.shopName ?? referral.shop}
                      </span>
                      {referral.shopName && (
                        <span className="mt-0.5 block text-[13.5px] text-body-mute">
                          {referral.shop}
                        </span>
                      )}
                    </RowHeader>
                    <Td>
                      <ReferralPill status={referral.status} />
                    </Td>
                    <Td>
                      <code className="text-[14px] tracking-[0.03em]">{referral.code}</code>
                    </Td>
                    <Td>{formatDate(referral.linkedAt)}</Td>
                    <Td numeric>{formatMoney(referral.earnedCents, referral.currency)}</Td>
                  </Row>
                ))}
              </Body>
            </Table>
            {referralCount > referrals.length && (
              <p className="border-t border-line px-5 py-3 text-[13.5px] text-body-mute">
                Showing the latest {referrals.length} of {referralCount}.
              </p>
            )}
          </>
        )}
      </Panel>

      <Panel title="Ledger" scroll={commissions.length > 0}>
        {commissions.length === 0 ? (
          <Empty title="Nothing earned yet">
            A commission is written when a referred store actually pays us.
          </Empty>
        ) : (
          <>
            <Table caption="Every commission on this account">
              <Head>
                <Th>Store</Th>
                <Th>Status</Th>
                <Th>Kind</Th>
                <Th>Recorded</Th>
                <Th numeric>Charge</Th>
                <Th numeric>Rate</Th>
                <Th numeric>Commission</Th>
              </Head>
              <Body>
                {commissions.map((commission) => (
                  <Row key={commission.id}>
                    <RowHeader>{commission.shopName ?? commission.shop}</RowHeader>
                    <Td>
                      <CommissionPill status={commission.status} />
                    </Td>
                    <Td>{commission.kind === "recurring" ? "Recurring" : "One-time"}</Td>
                    <Td>{formatDate(commission.createdAt)}</Td>
                    <Td numeric>{formatMoney(commission.chargeCents, commission.currency)}</Td>
                    <Td numeric>{formatRate(commission.rateBps)}</Td>
                    <Td numeric>{formatMoney(commission.amountCents, commission.currency)}</Td>
                  </Row>
                ))}
              </Body>
            </Table>
            {commissionCount > commissions.length && (
              <p className="border-t border-line px-5 py-3 text-[13.5px] text-body-mute">
                Showing the latest {commissions.length} of {commissionCount}.
              </p>
            )}
          </>
        )}
      </Panel>

      <Panel title="Payouts" scroll={payouts.length > 0}>
        {payouts.length === 0 ? (
          <Empty title="Nothing paid out yet">
            Record one from the Payouts tab once commission has cleared.
          </Empty>
        ) : (
          <Table caption="Payouts made to this partner">
            <Head>
              <Th>Paid</Th>
              <Th>Method</Th>
              <Th>Reference</Th>
              <Th numeric>Settled</Th>
              <Th numeric>Amount</Th>
            </Head>
            <Body>
              {payouts.map((payout) => (
                <Row key={payout.id}>
                  <RowHeader>{formatDate(payout.paidAt)}</RowHeader>
                  <Td>
                    <span className="capitalize">{payout.method}</span>
                  </Td>
                  <Td>{payout.reference ?? <span className="text-muted">—</span>}</Td>
                  <Td numeric>{payout.commissionCount}</Td>
                  <Td numeric>{formatMoney(payout.amountCents, payout.currency)}</Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>
    </div>
  );
}
