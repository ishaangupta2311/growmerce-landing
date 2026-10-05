import type { Metadata } from "next";
import { randomUUID } from "node:crypto";

import { requireAdmin } from "@/lib/admin/session";
import { formatDate } from "@/lib/affiliate/format";
import { emailOverview, type ContactStatus, type EmailResults } from "@/lib/growsearch/email";
import { PageHeader } from "@/components/admin/ui";
import CampaignForm from "@/components/admin/email/CampaignForm";
import SweepButton from "@/components/admin/email/SweepButton";
import Empty from "@/components/affiliate/Empty";
import Panel from "@/components/affiliate/Panel";
import StatCard from "@/components/affiliate/StatCard";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";

export const metadata: Metadata = { title: "Merchant email" };

/**
 * Merchant email: who is on the list, how each email performed, and sending a
 * one-off campaign. Everything on this page is read from, and done by, the
 * Growsearch app — see `src/lib/growsearch/email.ts`.
 */

const LIFECYCLE: Record<string, { name: string; when: string }> = {
  welcome: { name: "Welcome", when: "On install, to a store with no searches yet." },
  setup_nudge: { name: "Setup nudge", when: "Two days after install, if still no search has arrived." },
  review_request: { name: "Review request", when: "After 100 searches over at least 14 days. Sent once." },
};

const STATUS: Record<ContactStatus, { label: string; tone: string }> = {
  subscribed: { label: "Subscribed", tone: "text-brand" },
  unsubscribed: { label: "Unsubscribed", tone: "text-body-mute" },
  uninstalled: { label: "Uninstalled", tone: "text-body-mute" },
  no_address: { label: "No address", tone: "text-muted" },
};

/** A count, and what share of the emails sent it is. */
function share(count: number, sent: number): string {
  if (sent === 0) return "—";
  return `${count} (${Math.round((count / sent) * 100)}%)`;
}

function emailName(key: string, campaigns: Map<string, string>): string {
  if (key.startsWith("campaign:")) return campaigns.get(key.slice("campaign:".length)) ?? "Campaign";
  return LIFECYCLE[key]?.name ?? key;
}

function ResultCells({ results }: { results: EmailResults }) {
  return (
    <>
      <Td numeric>{results.sent}</Td>
      <Td numeric>{share(results.delivered, results.sent)}</Td>
      <Td numeric>{share(results.opened, results.sent)}</Td>
      <Td numeric>{share(results.clicked, results.sent)}</Td>
      <Td numeric>{share(results.bounced, results.sent)}</Td>
      <Td numeric>{share(results.complained, results.sent)}</Td>
    </>
  );
}

function ResultHeadings() {
  return (
    <>
      <Th numeric>Sent</Th>
      <Th numeric>Delivered</Th>
      <Th numeric>Opened</Th>
      <Th numeric>Clicked</Th>
      <Th numeric>Bounced</Th>
      <Th numeric>Spam</Th>
    </>
  );
}

export default async function AdminEmailPage() {
  const admin = await requireAdmin();
  const answer = await emailOverview();

  if (!answer.ok) {
    return (
      <>
        <PageHeader title="Merchant email" description="Email to the merchants who installed Growsearch." />
        <Panel title="Could not load merchant email">
          <Empty title="The Growsearch app did not give us the list">{answer.error}</Empty>
        </Panel>
      </>
    );
  }

  const overview = answer.data;
  const campaignSubjects = new Map(overview.campaigns.map((campaign) => [campaign.id, campaign.subject]));

  return (
    <>
      <PageHeader
        title="Merchant email"
        description="Who is on the list, how each email performed, and sending a one-off campaign."
      />
      <div className="space-y-8">
        {!overview.configured && (
          <p
            role="alert"
            className="rounded-[10px] border border-brand/30 bg-cream px-4 py-3 text-[14.5px] leading-snug text-brand"
          >
            Email is not configured on the Growsearch app, so nothing is being sent. Set RESEND_API_KEY and
            EMAIL_FROM there.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Subscribed"
            value={String(overview.totals.subscribed)}
            note="Installed, and receiving email."
            emphasis
          />
          <StatCard
            label="Unsubscribed"
            value={String(overview.totals.unsubscribed)}
            note="Opted out, bounced, or reported spam. Never emailed."
          />
          <StatCard
            label="Uninstalled"
            value={String(overview.totals.uninstalled)}
            note="Kept on the list; lifecycle email stopped."
          />
          <StatCard label="All stores" value={String(overview.totals.contacts)} note="Every store we hold a record for." />
        </div>

        <Panel title="Automatic emails" action={<SweepButton />} scroll>
          <Table caption="Results for each automatic email">
            <Head>
              <Th>Email</Th>
              <ResultHeadings />
              <Th>Last sent</Th>
            </Head>
            <Body>
              {overview.lifecycle.map((email) => (
                <Row key={email.key}>
                  <RowHeader>
                    <span className="block text-[15px] font-bold text-charcoal">
                      {LIFECYCLE[email.key]?.name ?? email.key}
                    </span>
                    <span className="mt-0.5 block max-w-[40ch] text-[13px] leading-snug text-muted">
                      {LIFECYCLE[email.key]?.when}
                    </span>
                  </RowHeader>
                  <ResultCells results={email} />
                  <Td>{email.lastSentAt ? formatDate(new Date(email.lastSentAt)) : "—"}</Td>
                </Row>
              ))}
            </Body>
          </Table>
        </Panel>

        <Panel title="Campaigns" scroll={overview.campaigns.length > 0}>
          {overview.campaigns.length === 0 ? (
            <Empty title="No campaign has been sent">Write one below. Send yourself a test first.</Empty>
          ) : (
            <Table caption="Results for each campaign">
              <Head>
                <Th>Campaign</Th>
                <ResultHeadings />
                <Th>Sent</Th>
              </Head>
              <Body>
                {overview.campaigns.map((campaign) => (
                  <Row key={campaign.id}>
                    <RowHeader>
                      <span className="block max-w-[40ch] text-[15px] font-bold text-charcoal">{campaign.subject}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                        {campaign.audience === "all" ? "Everyone, including uninstalled" : "Installed stores"}
                        {campaign.createdBy ? ` · ${campaign.createdBy}` : ""}
                        {campaign.completedAt ? "" : " · still sending"}
                      </span>
                    </RowHeader>
                    <ResultCells results={campaign} />
                    <Td>{formatDate(new Date(campaign.createdAt))}</Td>
                  </Row>
                ))}
              </Body>
            </Table>
          )}
        </Panel>

        <Panel title="Send a campaign">
          <CampaignForm campaignId={randomUUID()} audiences={overview.audiences} adminEmail={admin.email} />
        </Panel>

        <Panel
          title={`${overview.contacts.length} store${overview.contacts.length === 1 ? "" : "s"}`}
          scroll={overview.contacts.length > 0}
        >
          {overview.contacts.length === 0 ? (
            <Empty title="Nobody is on the list yet">
              A store joins the first time its merchant opens Growsearch after installing.
            </Empty>
          ) : (
            <Table caption="Every store on the merchant email list">
              <Head>
                <Th>Store</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Emails received</Th>
                <Th>Joined</Th>
              </Head>
              <Body>
                {overview.contacts.map((contact) => (
                  <Row key={contact.shop}>
                    <RowHeader>
                      <span className="block text-[15px] font-bold text-charcoal">
                        {contact.shopName ?? contact.shop}
                      </span>
                      {contact.shopName && (
                        <span className="mt-0.5 block text-[13px] text-muted">{contact.shop}</span>
                      )}
                    </RowHeader>
                    <Td>{contact.email ?? <span className="text-muted">—</span>}</Td>
                    <Td>
                      <span className={`font-bold ${STATUS[contact.status].tone}`}>
                        {STATUS[contact.status].label}
                      </span>
                    </Td>
                    <Td>
                      {contact.sends.length === 0 ? (
                        <span className="text-muted">None yet</span>
                      ) : (
                        <span className="block max-w-[38ch] text-[14px] leading-snug">
                          {contact.sends.map((send) => emailName(send.emailKey, campaignSubjects)).join(", ")}
                        </span>
                      )}
                    </Td>
                    <Td>{formatDate(new Date(contact.subscribedAt))}</Td>
                  </Row>
                ))}
              </Body>
            </Table>
          )}
        </Panel>

        <p className="max-w-[70ch] text-[13.5px] leading-relaxed text-body-mute">
          Opens and clicks are counted only while open and click tracking are switched on for the sending domain in
          Resend, and opens are approximate: some mail apps load images without the merchant reading the email.
        </p>
      </div>
    </>
  );
}
