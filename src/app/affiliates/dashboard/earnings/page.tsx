import type { Metadata } from "next";

import { clearsAt, formatRate, HOLD_DAYS } from "@/lib/affiliate/commission";
import { formatCountdown, formatDate, formatMoney } from "@/lib/affiliate/format";
import { requirePartner } from "@/lib/affiliate/session";
import { offsetFor, PAGE_SIZE, pageCountFor, pageFrom } from "@/lib/affiliate/paging";
import { commissionCountFor, commissionsFor, totalsFor } from "@/lib/affiliate/store";
import Empty from "@/components/affiliate/Empty";
import Pager from "@/components/affiliate/Pager";
import Panel from "@/components/affiliate/Panel";
import StatCard from "@/components/affiliate/StatCard";
import { CommissionPill } from "@/components/affiliate/StatusPill";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";

export const metadata: Metadata = { title: "Earnings" };

/**
 * The ledger itself, one row per amount earned.
 *
 * Every row shows what the store was charged as well as what it earned. A
 * partner who can see both can check our arithmetic against their rate, and a
 * commission somebody can check is a commission they do not have to email about.
 *
 * Reversed rows are listed rather than hidden. A balance that quietly shrinks
 * between two visits is the thing this page exists to make impossible.
 *
 * Paged, fifty at a time, against a real count. The count comes first because
 * the page number is clamped to it — a `?page=` past the end shows the last
 * page, not an empty table — so the rows cannot be fetched in the same round.
 */
export default async function EarningsPage({
  searchParams,
}: {
  /* A repeated key resolves to an array — `?page=2&page=5` is a URL somebody
     can type — so the type says so and `pageFrom` takes the last of them. */
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { partner } = await requirePartner();
  const [{ page: requested }, totals, total] = await Promise.all([
    searchParams,
    totalsFor(partner.id),
    commissionCountFor(partner.id),
  ]);
  const pageCount = pageCountFor(total);
  const page = pageFrom(requested, pageCount);
  const commissions = await commissionsFor(partner.id, PAGE_SIZE, offsetFor(page));

  /* The same zeroed row the payouts page falls back to, for the same reason.
     `totalsFor` returns one row per currency that has earned something, so a
     partner approved this morning has no rows at all — as does one whose only
     commission was reversed — and a page that renders no cards whatsoever
     reads as a page that failed rather than as a balance of nothing. */
  const balances =
    totals.length > 0
      ? totals
      : [
          {
            currency: partner.payoutCurrency,
            approvedCents: 0,
            pendingCents: 0,
            paidCents: 0,
            lifetimeCents: 0,
          },
        ];

  return (
    <div className="space-y-8">
      {balances.map((total) => (
        <section key={total.currency}>
          {balances.length > 1 && (
            <h2 className="mb-3 font-poppins text-[15px] font-bold text-charcoal">
              In {total.currency}
            </h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              emphasis
              label="Owed to you"
              value={formatMoney(total.approvedCents, total.currency)}
            />
            <StatCard
              label="Still clearing"
              value={formatMoney(total.pendingCents, total.currency)}
              note={`Commission clears ${HOLD_DAYS} days after the payment it came from.`}
            />
            <StatCard label="Paid to date" value={formatMoney(total.paidCents, total.currency)} />
            <StatCard
              label="Lifetime"
              value={formatMoney(total.lifetimeCents, total.currency)}
              note="Everything ever earned, minus anything reversed."
            />
          </div>
        </section>
      ))}

      <Panel
        title={`Every commission (${total})`}
        scroll={commissions.length > 0}
        action={
          <span className="font-poppins text-[14.5px] text-body-mute">
            Your rate: {formatRate(partner.commissionRateBps)}
          </span>
        }
      >
        {commissions.length === 0 ? (
          <Empty title="Nothing earned yet">
            Commission is created the day a store you referred actually pays us.
            An install or a free trial does not earn — the payment does.
          </Empty>
        ) : (
          <Table caption="Every commission you have earned">
            <Head>
              <Th>Store</Th>
              <Th>Status</Th>
              <Th>Period</Th>
              <Th numeric>Store paid</Th>
              <Th numeric>Your share</Th>
            </Head>
            <Body>
              {commissions.map((commission) => (
                <Row key={commission.id}>
                  <RowHeader>
                    <span className="font-poppins font-bold text-charcoal">
                      {commission.shopName ?? commission.shop}
                    </span>
                    <span className="block text-[13.5px] text-body-mute">
                      {commission.kind === "one_time" ? "One-off" : "Recurring"} ·{" "}
                      {formatDate(commission.createdAt)}
                    </span>
                  </RowHeader>
                  <Td>
                    <CommissionPill status={commission.status} />
                    {commission.status === "pending" && (
                      <span className="ml-2 text-[13.5px] whitespace-nowrap text-body-mute">
                        {formatCountdown(clearsAt(commission.createdAt))}
                      </span>
                    )}
                  </Td>
                  <Td>
                    {commission.periodStart && commission.periodEnd ? (
                      <span className="text-[14px] whitespace-nowrap text-body-mute">
                        {formatDate(commission.periodStart)} – {formatDate(commission.periodEnd)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td numeric>
                    <span className="text-body-mute">
                      {formatMoney(commission.chargeCents, commission.currency)}
                    </span>
                  </Td>
                  <Td numeric>
                    <span
                      className={
                        commission.status === "reversed"
                          ? "text-muted line-through"
                          : "font-bold text-charcoal"
                      }
                    >
                      {formatMoney(commission.amountCents, commission.currency)}
                    </span>
                  </Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>

      <Pager
        page={page}
        pageCount={pageCount}
        total={total}
        noun="commission"
        href={(n) =>
          n <= 1 ? "/affiliates/dashboard/earnings" : `/affiliates/dashboard/earnings?page=${n}`
        }
      />
    </div>
  );
}
