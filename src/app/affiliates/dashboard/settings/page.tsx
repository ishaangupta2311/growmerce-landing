import type { Metadata } from "next";

import { describeTerms, formatRate, HOLD_DAYS } from "@/lib/affiliate/commission";
import { formatCode } from "@/lib/affiliate/codes";
import { formatDate } from "@/lib/affiliate/format";
import { requirePartner } from "@/lib/affiliate/session";
import { codesFor } from "@/lib/affiliate/store";
import CopyCode from "@/components/affiliate/CopyCode";
import Panel from "@/components/affiliate/Panel";
import { PayoutForm, ProfileForm } from "@/components/affiliate/forms/SettingsForms";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";

export const metadata: Metadata = { title: "Settings" };

/**
 * The four things a partner can see about their own account, and the two they
 * can change.
 *
 * The terms panel is read-only and says so. A partner's rate and programme are
 * what they agreed to; making them look editable and then rejecting the edit is
 * worse than not offering it, and quietly letting somebody change their own
 * commission rate is worse than both.
 */
export default async function SettingsPage() {
  const { partner } = await requirePartner();
  const codes = await codesFor(partner.id);

  return (
    <div className="space-y-8">
      <Panel title="Your details">
        <ProfileForm partner={partner} />
      </Panel>

      <Panel title="How you get paid">
        <PayoutForm partner={partner} />
      </Panel>

      <Panel title="Your codes" scroll={codes.length > 1}>
        {codes.length <= 1 ? (
          <div className="space-y-4">
            {codes[0] ? (
              <>
                <CopyCode code={codes[0].code} />
                <p className="text-[15px] leading-relaxed text-body-mute">
                  {codes[0].referralCount === 0
                    ? "No store has used it yet."
                    : `${codes[0].referralCount} store${codes[0].referralCount === 1 ? " has" : "s have"} used it.`}{" "}
                  Need a second code — one per campaign, or one per client —
                  ask us and we will add it.
                </p>
              </>
            ) : (
              <p className="text-[15px] text-body-mute">
                No code yet. Write to us and we will sort it out today.
              </p>
            )}
          </div>
        ) : (
          <Table caption="Every affiliate code on your account">
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
                    {!code.active && (
                      <span className="ml-2 text-[13.5px] text-muted">retired</span>
                    )}
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

      <Panel title="Your terms">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
              Programme
            </dt>
            <dd className="mt-1.5 text-[16px] text-charcoal">
              {partner.kind === "agency" ? "Web-dev agency" : "Creator"}
            </dd>
          </div>
          <div>
            <dt className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
              Commission rate
            </dt>
            <dd className="mt-1.5 text-[16px] text-charcoal">
              {formatRate(partner.commissionRateBps)}
            </dd>
          </div>
          <div>
            <dt className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
              Sign-in email
            </dt>
            <dd className="mt-1.5 text-[16px] break-all text-charcoal">{partner.email}</dd>
          </div>
          <div>
            <dt className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
              Joined
            </dt>
            <dd className="mt-1.5 text-[16px] text-charcoal">{formatDate(partner.createdAt)}</dd>
          </div>
        </dl>

        <p className="mt-6 border-t border-line pt-5 text-[15px] leading-relaxed text-body-mute">
          {describeTerms(partner.kind, partner.commissionRateBps)} Commission
          clears {HOLD_DAYS} days after the payment it came from. These terms are
          set on your account and are not editable here — if something needs to
          change, write to us and we will change it properly.
        </p>
      </Panel>
    </div>
  );
}
