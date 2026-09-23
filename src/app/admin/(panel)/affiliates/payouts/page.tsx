import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin/session";
import { amountsDue, recentPayouts } from "@/lib/affiliate/admin-store";
import { formatDate, formatMoney } from "@/lib/affiliate/format";
import { PageHeader } from "@/components/admin/ui";
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
 *
 * The banner at the top is where `createPayout` says it worked, because the
 * form that would otherwise have said so is gone by then — see the redirect at
 * the end of that action.
 */
export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{
    recorded?: string | string[];
    currency?: string | string[];
    count?: string | string[];
  }>;
}) {
  await requireAdmin();

  const [params, due, payouts] = await Promise.all([
    searchParams,
    amountsDue(),
    recentPayouts(60),
  ]);
  const recorded = recordedFrom(params);

  return (
    <>
      <PageHeader title="Payouts" description="What is owed, per partner and currency, and what has been sent." />
      <div className="space-y-8">
        {recorded && (
          <p
            role="status"
            className="rounded-[12px] border border-brand/25 bg-cream px-5 py-4 text-[15px] leading-relaxed text-charcoal"
          >
            <strong className="font-bold">
              Recorded {formatMoney(recorded.amountCents, recorded.currency)}
            </strong>
            , settling {recorded.count} commission{recorded.count === 1 ? "" : "s"}.
          </p>
        )}
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
                          href={`/admin/affiliates/partners/${row.partnerId}`}
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
                        href={`/admin/affiliates/partners/${payout.partnerId}`}
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
    </>
  );
}

/**
 * The confirmation `createPayout` redirected here with, or null.
 *
 * Read as suspiciously as any other query string, because that is what it is:
 * the URL is in the address bar and anybody can edit it, a repeated key arrives
 * as an array rather than a string, and what this renders is a sentence saying
 * money has left our bank. A figure that is not a whole number of minor units,
 * or a currency that is not a three-letter code, is junk and gets no banner —
 * the payout itself is in the table below either way.
 */
function recordedFrom(params: {
  recorded?: string | string[];
  currency?: string | string[];
  count?: string | string[];
}): { amountCents: number; currency: string; count: number } | null {
  const amountCents = Number(last(params.recorded));
  const currency = (last(params.currency) ?? "").toUpperCase();
  const count = Number(last(params.count));

  if (!Number.isInteger(amountCents) || amountCents <= 0) return null;
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  if (!Number.isInteger(count) || count <= 0) return null;

  return { amountCents, currency, count };
}

/** `?a=1&a=2` resolves to `['1', '2']`; the last one is the one that was meant. */
function last(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[value.length - 1] : value;
}
