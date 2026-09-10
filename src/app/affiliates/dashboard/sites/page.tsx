import type { Metadata } from "next";

import { formatDate, formatMoney } from "@/lib/affiliate/format";
import { requirePartner } from "@/lib/affiliate/session";
import { referralsFor } from "@/lib/affiliate/store";
import Empty from "@/components/affiliate/Empty";
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
 */
export default async function SitesPage() {
  const { partner } = await requirePartner();
  const referrals = await referralsFor(partner.id, partner.payoutCurrency);

  return (
    <Panel title={`Referred stores (${referrals.length})`} scroll={referrals.length > 0}>
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
  );
}
