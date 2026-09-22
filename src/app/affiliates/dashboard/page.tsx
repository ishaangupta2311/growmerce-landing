import type { Metadata } from "next";
import Link from "next/link";

import { clearsAt } from "@/lib/affiliate/commission";
import { formatCountdown, formatDate, formatMoney } from "@/lib/affiliate/format";
import { requirePartner } from "@/lib/affiliate/session";
import { codesFor, dashboardSummary } from "@/lib/affiliate/store";
import type { DashboardSummary } from "@/lib/affiliate/types";
import CopyCode from "@/components/affiliate/CopyCode";
import Empty from "@/components/affiliate/Empty";
import Panel from "@/components/affiliate/Panel";
import StatCard from "@/components/affiliate/StatCard";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";
import { CommissionPill, ReferralPill } from "@/components/affiliate/StatusPill";

export const metadata: Metadata = { title: "Overview" };

/**
 * "41 subscribed · 7 on trial · 11 not yet paying · 1 cancelled", with the
 * empty buckets left out.
 *
 * Every bucket that has anything in it, because these sit under the total and
 * have to add up to it: the note used to name two of the four, so a partner
 * with 60 stores read a card saying 60 above a line accounting for 52 and no
 * way to tell which eight were missing. The words are the ones the stores page
 * puts on the same statuses, so counting the rows there gives the same answer.
 */
function referralNote(referrals: DashboardSummary["referrals"]): string {
  const buckets: [number, string][] = [
    [referrals.active, "subscribed"],
    [referrals.trialing, "on trial"],
    [referrals.linked, "not yet paying"],
    [referrals.cancelled, "cancelled"],
  ];
  return buckets
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`)
    .join(" · ");
}

/**
 * The page a partner opens to answer one question: how much of this can I have?
 *
 * Which is why "owed to you" is the emphasised card and the other three are
 * quiet. A row of four equally weighted orange numbers makes the reader work
 * out which one is theirs, and the one they will assume is the biggest.
 */
export default async function OverviewPage() {
  const { partner } = await requirePartner();
  const [summary, codes] = await Promise.all([
    dashboardSummary(partner.id, partner.payoutCurrency),
    codesFor(partner.id),
  ]);

  const { totals } = summary;
  const primary = codes.find((code) => code.active) ?? codes[0];

  return (
    <div className="space-y-8">
      <section className="rounded-[16px] border border-brand/25 bg-cream p-6 sm:p-7">
        <h2 className="font-poppins text-[13px] font-bold tracking-[0.04em] text-brand uppercase">
          Your affiliate code
        </h2>
        <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-body-mute">
          The merchant types this into Growsearch when they install it. Dashes
          and capitals do not matter — <code className="font-poppins">acme7k2m9</code>{" "}
          and <code className="font-poppins">ACME-7K2M9</code> are the same code.
        </p>
        <div className="mt-5">
          {primary ? (
            <CopyCode code={primary.code} />
          ) : (
            <p className="text-[15px] text-body-mute">
              No code yet — write to us and we will sort it out today.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="sr-only">Earnings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            emphasis
            label="Owed to you"
            value={formatMoney(totals.approvedCents, totals.currency)}
            note="Cleared and waiting on the next payout run."
          />
          <StatCard
            label="Still clearing"
            value={formatMoney(totals.pendingCents, totals.currency)}
            note="Inside the refund window. It becomes owed automatically."
          />
          <StatCard
            label="Paid to date"
            value={formatMoney(totals.paidCents, totals.currency)}
            note="Everything we have already sent you."
          />
          <StatCard
            label="Stores referred"
            value={String(summary.referrals.total)}
            note={referralNote(summary.referrals)}
          />
        </div>

        {summary.otherCurrencies.length > 0 && (
          <p className="mt-3 text-[14px] text-body-mute">
            You have also earned{" "}
            {summary.otherCurrencies
              .map((other) => formatMoney(other.lifetimeCents, other.currency))
              .join(", ")}{" "}
            in other currencies. See{" "}
            <Link href="/affiliates/dashboard/earnings" className="font-bold text-brand underline">
              earnings
            </Link>
            .
          </p>
        )}
      </section>

      <Panel
        title="Latest commission"
        scroll
        action={
          <Link
            href="/affiliates/dashboard/earnings"
            className="font-poppins text-[14.5px] font-bold text-brand hover:underline"
          >
            All earnings
          </Link>
        }
      >
        {summary.recentCommissions.length === 0 ? (
          <div className="p-5">
            <Empty title="Nothing earned yet">
              The first commission appears the day one of your stores pays us —
              not when they install, and not when they start a trial.
            </Empty>
          </div>
        ) : (
          <Table caption="Your most recent commissions">
            <Head>
              <Th>Store</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th numeric>Amount</Th>
            </Head>
            <Body>
              {summary.recentCommissions.map((commission) => (
                <Row key={commission.id}>
                  <RowHeader>
                    <span className="font-poppins font-bold text-charcoal">
                      {commission.shopName ?? commission.shop}
                    </span>
                  </RowHeader>
                  <Td>
                    <CommissionPill status={commission.status} />
                    {commission.status === "pending" && (
                      <span className="ml-2 text-[13.5px] text-body-mute">
                        {formatCountdown(clearsAt(commission.createdAt))}
                      </span>
                    )}
                  </Td>
                  <Td>{formatDate(commission.createdAt)}</Td>
                  <Td numeric>{formatMoney(commission.amountCents, commission.currency)}</Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>

      <Panel
        title="Recently referred stores"
        scroll
        action={
          <Link
            href="/affiliates/dashboard/sites"
            className="font-poppins text-[14.5px] font-bold text-brand hover:underline"
          >
            All stores
          </Link>
        }
      >
        {summary.recentReferrals.length === 0 ? (
          <div className="p-5">
            <Empty title="No stores yet">
              A store appears here the moment a merchant enters your code in
              Growsearch — before they pay anything.
            </Empty>
          </div>
        ) : (
          <Table caption="Stores that entered your code most recently">
            <Head>
              <Th>Store</Th>
              <Th>Status</Th>
              <Th>Referred</Th>
              <Th numeric>Earned</Th>
            </Head>
            <Body>
              {summary.recentReferrals.map((referral) => (
                <Row key={referral.id}>
                  <RowHeader>
                    <span className="font-poppins font-bold text-charcoal">
                      {referral.shopName ?? referral.shop}
                    </span>
                    {referral.shopName && (
                      <span className="block text-[13.5px] text-body-mute">{referral.shop}</span>
                    )}
                  </RowHeader>
                  <Td>
                    <ReferralPill status={referral.status} />
                  </Td>
                  <Td>{formatDate(referral.linkedAt)}</Td>
                  <Td numeric>{formatMoney(referral.earnedCents, referral.currency)}</Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>
    </div>
  );
}
