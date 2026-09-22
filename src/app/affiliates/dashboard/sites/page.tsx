import type { Metadata } from "next";

import { formatDate, formatMoney } from "@/lib/affiliate/format";
import { offsetFor, PAGE_SIZE, pageCountFor, pageFrom } from "@/lib/affiliate/paging";
import { requirePartner } from "@/lib/affiliate/session";
import { referralCountFor, referralsFor } from "@/lib/affiliate/store";
import Empty from "@/components/affiliate/Empty";
import Pager from "@/components/affiliate/Pager";
import Panel from "@/components/affiliate/Panel";
import { ReferralPill } from "@/components/affiliate/StatusPill";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";

export const metadata: Metadata = { title: "Referred stores" };

/**
 * Every store that has entered this partner's code.
 *
 * Deliberately includes the ones that have never paid a penny and the ones that
 * churned. An agency wants to know that a client they set up in March is
 * showing as "not yet paying" in May — that is a conversation to have with the
 * client, and it is invisible if the table only lists what earned money.
 *
 * Paged against a real count, so the heading's number is the number of stores
 * and not the size of the first page. See the earnings page for the ordering
 * of the two queries.
 */
export default async function SitesPage({
  searchParams,
}: {
  /* An array when the key is repeated, as on the earnings page. */
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { partner } = await requirePartner();
  const [{ page: requested }, total] = await Promise.all([
    searchParams,
    referralCountFor(partner.id),
  ]);
  const pageCount = pageCountFor(total);
  const page = pageFrom(requested, pageCount);
  const referrals = await referralsFor(partner.id, partner.payoutCurrency, PAGE_SIZE, offsetFor(page));

  return (
    <div className="space-y-6">
      <Panel title={`Referred stores (${total})`} scroll={referrals.length > 0}>
        {referrals.length === 0 ? (
          <Empty title="No stores have used your code yet">
            A store lands here the moment a merchant types your code into
            Growsearch. There is no cookie and no expiry window, so it does not
            matter how long ago they heard about you.
          </Empty>
        ) : (
          <Table caption="Every store that has entered your affiliate code">
            <Head>
              <Th>Store</Th>
              <Th>Status</Th>
              <Th>Plan</Th>
              <Th>Referred</Th>
              <Th>Code</Th>
              <Th numeric>Earned</Th>
            </Head>
            <Body>
              {referrals.map((referral) => (
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
                  <Td>{referral.plan ?? <span className="text-muted">—</span>}</Td>
                  <Td>{formatDate(referral.linkedAt)}</Td>
                  <Td>
                    <code className="font-poppins text-[14px] text-body-mute">{referral.code}</code>
                  </Td>
                  <Td numeric>{formatMoney(referral.earnedCents, referral.currency)}</Td>
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
        noun="store"
        href={(n) =>
          n <= 1 ? "/affiliates/dashboard/sites" : `/affiliates/dashboard/sites?page=${n}`
        }
      />
    </div>
  );
}
