import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/affiliate/admin";
import { amountsDue, recentPayouts } from "@/lib/affiliate/admin-store";
import { formatDate, formatMoney } from "@/lib/affiliate/format";
import Empty from "@/components/affiliate/Empty";
import Panel from "@/components/affiliate/Panel";
import { PartnerPill } from "@/components/affiliate/StatusPill";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";
import PayoutForm from "@/components/affiliate/admin/PayoutForm";

export const metadata: Metadata = { title: "Payouts" };

/**
 * What we owe, and what we have already sent.
 *
 * One row per partner *per currency*, because that is what a payout is: one
 * transfer moves one currency. A partner earning in two gets two rows and two
 * transfers, which is tedious and correct.
 *
 * Each row's form is inside a `<details>`. The alternative — every form open at
 * once — puts a dozen "record this payout" buttons on one screen, and the
 * failure mode of this page is pressing the wrong one. Opening one is a small
 * deliberate act before an irreversible-ish one.
 */
export default async function AdminPayoutsPage() {
  await requireAdmin();

  const [due, payouts] = await Promise.all([amountsDue(), recentPayouts(60)]);

  return (
    <div className="space-y-8">
      <Panel title={`${due.length} payout${due.length === 1 ? "" : "s"} to make`}>
        {due.length === 0 ? (
          <Empty title="Nothing is owed">
            Commission clears 30 days after the payment it came from, and appears
            here the moment it does.
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {due.map((row) => (
              <li key={`${row.partnerId}-${row.currency}`} className="py-4 first:pt-0 last:pb-0">
                <details className="group">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-[10px] px-1 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                    <div>
                      <p className="font-poppins text-[16px] font-bold text-charcoal">
                        {row.company}
                        {row.status !== "approved" && (
                          <span className="ml-2 align-middle">
                            <PartnerPill status={row.status} />
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[13.5px] text-body-mute">
                        {row.commissionCount} commission
                        {row.commissionCount === 1 ? "" : "s"}
                        {row.waitingSince && ` · waiting since ${formatDate(row.waitingSince)}`}
                        {!row.payoutDetails && " · no payout details on file"}
                      </p>
                    </div>
                    <p className="font-poppins text-[19px] font-bold tabular-nums text-brand">
                      {formatMoney(row.owedCents, row.currency)}
                      <span className="ml-2 text-[13px] font-bold text-body-mute uppercase">
                        {row.currency}
                      </span>
                    </p>
                  </summary>

                  <div className="mt-4 rounded-[14px] border border-line bg-cream/50 p-5">
                    <PayoutForm due={row} />
                    <p className="mt-4 border-t border-line pt-4 text-[13.5px] text-body-mute">
                      <Link
                        href={`/affiliates/admin/partners/${row.partnerId}`}
                        className="font-bold text-brand underline"
                      >
                        Open {row.name}&rsquo;s account
                      </Link>{" "}
                      to see the commissions this settles.
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Payouts made" scroll={payouts.length > 0}>
        {payouts.length === 0 ? (
          <Empty title="None yet">
            Every payout you record shows here, newest first, for reconciling
            against the bank.
          </Empty>
        ) : (
          <Table caption="Every payout recorded">
            <Head>
              <Th>Partner</Th>
              <Th>Paid</Th>
              <Th>Method</Th>
              <Th>Reference</Th>
              <Th numeric>Settled</Th>
              <Th numeric>Amount</Th>
            </Head>
            <Body>
              {payouts.map((payout) => (
                <Row key={payout.id}>
                  <RowHeader>
                    <Link
                      href={`/affiliates/admin/partners/${payout.partnerId}`}
                      className="font-bold text-brand underline"
                    >
                      {payout.company}
                    </Link>
                  </RowHeader>
                  <Td>{formatDate(payout.paidAt)}</Td>
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
