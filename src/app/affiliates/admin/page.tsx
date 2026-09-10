import Link from "next/link";

import { requireAdmin } from "@/lib/affiliate/admin";
import { adminOverview, amountsDue, listPartners } from "@/lib/affiliate/admin-store";
import { formatDate, formatMoney, formatMoneyShort } from "@/lib/affiliate/format";
import { formatRate } from "@/lib/affiliate/commission";
import Empty from "@/components/affiliate/Empty";
import Panel from "@/components/affiliate/Panel";
import StatCard from "@/components/affiliate/StatCard";
import { PartnerPill } from "@/components/affiliate/StatusPill";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";

/**
 * What needs doing, in the order it needs doing.
 *
 * Applications first, because a person is waiting on each one and nothing else
 * on this page has a human attached to it. Money owed second. Everything else
 * is a number to glance at.
 */
export default async function AdminOverviewPage() {
  await requireAdmin();

  const [overview, pending, due] = await Promise.all([
    adminOverview(),
    listPartners({ status: "pending" }),
    amountsDue(),
  ]);

  /* One currency is the normal case and several is the honest one, so the
     headline shows the largest and the rest are listed under it rather than
     added to it. */
  const owed = overview.owed[0];
  const clearing = overview.clearing[0];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="To approve"
          value={String(overview.pendingApplications)}
          note={
            overview.pendingApplications === 0
              ? "Nobody is waiting."
              : "Applications waiting on an answer."
          }
          emphasis={overview.pendingApplications > 0}
        />
        <StatCard
          label="Owed now"
          value={owed ? formatMoneyShort(owed.cents, owed.currency) : "—"}
          note={
            owed
              ? `Cleared and unpaid, across ${owed.partners} partner${owed.partners === 1 ? "" : "s"}.`
              : "Nothing has cleared the refund window yet."
          }
          emphasis={Boolean(owed)}
        />
        <StatCard
          label="Still clearing"
          value={clearing ? formatMoneyShort(clearing.cents, clearing.currency) : "—"}
          note="Earned, inside the 30-day refund window."
        />
        <StatCard
          label="Stores referred"
          value={String(overview.referrals)}
          note={`${overview.activeReferrals} subscribed right now.`}
        />
      </div>

      {overview.owed.length > 1 && (
        <p className="text-[14.5px] leading-relaxed text-body-mute">
          Also owed:{" "}
          {overview.owed
            .slice(1)
            .map((row) => formatMoney(row.cents, row.currency))
            .join(", ")}
          . Currencies are never added together — a payout moves one of them.
        </p>
      )}

      <Panel title="Applications waiting" scroll={pending.length > 0}>
        {pending.length === 0 ? (
          <Empty title="Nothing in the queue">
            New applications land here the moment somebody finishes signing up.
          </Empty>
        ) : (
          <Table caption="Partner applications awaiting a decision">
            <Head>
              <Th>Applicant</Th>
              <Th>Program</Th>
              <Th>Rate</Th>
              <Th>Applied</Th>
              <Th numeric>Stores</Th>
            </Head>
            <Body>
              {pending.map((partner) => (
                <Row key={partner.id}>
                  <RowHeader>
                    <Link
                      href={`/affiliates/admin/partners/${partner.id}`}
                      className="font-bold text-brand underline"
                    >
                      {partner.company}
                    </Link>
                    <span className="mt-0.5 block text-[13.5px] text-body-mute">
                      {partner.name} · {partner.email}
                    </span>
                  </RowHeader>
                  <Td>{partner.kind === "agency" ? "Agency" : "Creator"}</Td>
                  <Td>{formatRate(partner.commissionRateBps)}</Td>
                  <Td>{formatDate(partner.createdAt)}</Td>
                  <Td numeric>{partner.referralCount}</Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>

      <Panel
        title="Payouts to make"
        scroll={due.length > 0}
        action={
          due.length > 0 ? (
            <Link
              href="/affiliates/admin/payouts"
              className="font-poppins text-[14.5px] font-bold text-brand underline"
            >
              Record a payout
            </Link>
          ) : undefined
        }
      >
        {due.length === 0 ? (
          <Empty title="Nothing owed">
            Commissions appear here once they clear the 30-day refund window.
          </Empty>
        ) : (
          <Table caption="Partners with cleared, unpaid commission">
            <Head>
              <Th>Partner</Th>
              <Th>Status</Th>
              <Th>Waiting since</Th>
              <Th numeric>Owed</Th>
            </Head>
            <Body>
              {due.slice(0, 8).map((row) => (
                <Row key={`${row.partnerId}-${row.currency}`}>
                  <RowHeader>
                    <Link
                      href={`/affiliates/admin/partners/${row.partnerId}`}
                      className="font-bold text-brand underline"
                    >
                      {row.company}
                    </Link>
                  </RowHeader>
                  <Td>
                    <PartnerPill status={row.status} />
                  </Td>
                  <Td>{row.waitingSince ? formatDate(row.waitingSince) : "—"}</Td>
                  <Td numeric>{formatMoney(row.owedCents, row.currency)}</Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>
    </div>
  );
}
