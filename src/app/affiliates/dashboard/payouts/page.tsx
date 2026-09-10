import type { Metadata } from "next";
import Link from "next/link";

import { HOLD_DAYS } from "@/lib/affiliate/commission";
import { formatDate, formatMoney } from "@/lib/affiliate/format";
import { requirePartner } from "@/lib/affiliate/session";
import { payoutsFor, totalsFor } from "@/lib/affiliate/store";
import Empty from "@/components/affiliate/Empty";
import Panel from "@/components/affiliate/Panel";
import StatCard from "@/components/affiliate/StatCard";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";

export const metadata: Metadata = { title: "Payouts" };

const METHOD_LABEL: Record<string, string> = {
  bank: "Bank transfer",
  paypal: "PayPal",
  wise: "Wise",
  other: "Other",
};

/**
 * What we have sent, and what is waiting to be sent.
 *
 * There is no "request payout" button, and its absence is the honest part of
 * this page: payouts are made by hand in this build, so a button would be a
 * form that emails somebody. The page says what actually happens instead, which
 * is the thing a partner needs in order to stop wondering.
 */
export default async function PayoutsPage() {
  const { partner } = await requirePartner();
  const [payouts, totals] = await Promise.all([payoutsFor(partner.id), totalsFor(partner.id)]);

  const owed = totals[0] ?? {
    currency: partner.payoutCurrency,
    approvedCents: 0,
    pendingCents: 0,
    paidCents: 0,
    lifetimeCents: 0,
  };

  const hasPayoutDetails = Boolean(partner.payoutMethod && partner.payoutDetails);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          emphasis
          label="Ready to pay"
          value={formatMoney(owed.approvedCents, owed.currency)}
          note="Cleared, and included in the next run."
        />
        <StatCard
          label="Still clearing"
          value={formatMoney(owed.pendingCents, owed.currency)}
          note={`Becomes payable ${HOLD_DAYS} days after each payment.`}
        />
        <StatCard label="Paid to date" value={formatMoney(owed.paidCents, owed.currency)} />
      </div>

      {!hasPayoutDetails && (
        <p
          role="status"
          className="rounded-[12px] border border-brand/25 bg-cream px-5 py-4 text-[15px] leading-relaxed text-charcoal"
        >
          <strong className="font-bold">We do not know where to send your money.</strong>{" "}
          Your commissions are safe and still adding up, but nothing can be paid
          out until you{" "}
          <Link
            href="/affiliates/dashboard/settings"
            className="font-bold text-brand underline"
          >
            add your payout details
          </Link>
          .
        </p>
      )}

      <Panel title="Payout history" scroll={payouts.length > 0}>
        {payouts.length === 0 ? (
          <Empty title="No payouts yet">
            We pay out by hand once a month, against everything that has cleared.
            When we do, it appears here with the reference your bank will show.
          </Empty>
        ) : (
          <Table caption="Payouts we have sent you">
            <Head>
              <Th>Date</Th>
              <Th>Method</Th>
              <Th>Reference</Th>
              <Th>Covers</Th>
              <Th numeric>Amount</Th>
            </Head>
            <Body>
              {payouts.map((payout) => (
                <Row key={payout.id}>
                  <RowHeader>
                    <span className="font-poppins font-bold text-charcoal">
                      {formatDate(payout.paidAt)}
                    </span>
                  </RowHeader>
                  <Td>{METHOD_LABEL[payout.method] ?? payout.method}</Td>
                  <Td>
                    {payout.reference ? (
                      <code className="font-poppins text-[14px] text-body-mute">
                        {payout.reference}
                      </code>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    {payout.commissionCount} commission
                    {payout.commissionCount === 1 ? "" : "s"}
                  </Td>
                  <Td numeric>
                    <span className="font-bold">
                      {formatMoney(payout.amountCents, payout.currency)}
                    </span>
                  </Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>

      <section className="rounded-[16px] border border-line bg-cream p-6 sm:p-7">
        <h2 className="font-poppins text-[16px] font-bold text-charcoal">How payouts work</h2>
        <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-body-mute">
          <li>
            <strong className="font-bold text-charcoal">1.</strong> A store you
            referred pays us. Your commission is created the same day and starts
            its {HOLD_DAYS}-day hold.
          </li>
          <li>
            <strong className="font-bold text-charcoal">2.</strong> After{" "}
            {HOLD_DAYS} days the payment can no longer be refunded, so the
            commission clears and becomes owed to you.
          </li>
          <li>
            <strong className="font-bold text-charcoal">3.</strong> Once a month
            we send everything that has cleared, to the details on your settings
            page, and record it above.
          </li>
        </ol>
        <p className="mt-4 text-[14.5px] text-body-mute">
          Anything unclear or missing?{" "}
          <Link href="/help" className="font-bold text-brand underline">
            Ask us
          </Link>{" "}
          — we would rather explain it than have you guess.
        </p>
      </section>
    </div>
  );
}
