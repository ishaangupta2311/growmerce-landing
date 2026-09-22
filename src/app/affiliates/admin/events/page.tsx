import type { Metadata } from "next";

import { requireAdmin } from "@/lib/affiliate/admin";
import { recentEvents } from "@/lib/affiliate/admin-store";
import Empty from "@/components/affiliate/Empty";
import Panel from "@/components/affiliate/Panel";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";

export const metadata: Metadata = { title: "Ingest log" };

/**
 * Everything the Growsearch app has told us, and what we did about it.
 *
 * This is the support tool. "Why is my client not showing up" is answered here
 * and nowhere else: either we never received an event for that store, or we
 * received one and ignored it for a reason this table names.
 *
 * The outcomes are shown in the database's own vocabulary — `ignored:
 * unknown_code` rather than a friendly paraphrase — because the person reading
 * this is going to grep the codebase for whatever it says. Everywhere a partner
 * can see, the words are translated; here they should not be.
 */
const OUTCOME_HELP: Record<string, string> = {
  "ignored:unknown_code": "The merchant typed a code we have never issued.",
  "ignored:retired_code": "The code exists but has been retired.",
  "ignored:shop_already_referred": "That store already belongs to another partner. First code wins.",
  "ignored:unknown_shop": "We have no referral for that store — the code event never arrived.",
  "ignored:partner_not_approved": "The partner was not approved, so the charge earned nothing.",
  "ignored:already_paid_once": "A creator's referral had already earned its one-time fee.",
  "ignored:referral_cancelled": "The store had already churned.",
  "ignored:charge_already_credited": "The same charge under a different event id.",
  "ignored:zero_amount": "A zero-value charge, so there was nothing to take a share of.",
  "ignored:already_paid_out": "The refunded commission had already been paid — not reversible here.",
  "ignored:no_commission_for_charge": "A refund for a charge that never earned anything.",
};

/** The suffix `replaySkippedCharges` stamps on a row it has already re-fed. */
const REPLAYED = " (replayed)";

/**
 * The help line for an outcome, replayed or not.
 *
 * `replaySkippedCharges` marks the rows it has worked through by appending to
 * their outcome rather than replacing it, which is right — the outcome is
 * still what happened — but it means the string no longer matches the table
 * above and every replayed row lost its explanation. Strip the suffix to find
 * the line, then say what the suffix means, because "it was refused and then
 * put through again" is the whole story of that row.
 */
function helpFor(outcome: string): string | undefined {
  const replayed = outcome.endsWith(REPLAYED);
  const help = OUTCOME_HELP[replayed ? outcome.slice(0, -REPLAYED.length) : outcome];
  if (!help) return undefined;
  return replayed ? `${help} It has since been replayed.` : help;
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  await requireAdmin();

  const { shop } = await searchParams;
  const events = await recentEvents(150, typeof shop === "string" ? shop : undefined);

  return (
    <div className="space-y-6">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <label
            htmlFor="shop"
            className="block font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase"
          >
            Filter by store
          </label>
          <input
            id="shop"
            name="shop"
            type="search"
            defaultValue={shop ?? ""}
            placeholder="acme.myshopify.com"
            className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-4 py-2.5 text-[15px] text-charcoal outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/25"
          />
        </div>
        <button
          type="submit"
          className="rounded-[10px] border border-line bg-white px-4 py-2.5 font-poppins text-[14.5px] font-bold text-charcoal transition-colors hover:border-brand hover:text-brand"
        >
          Filter
        </button>
      </form>

      <Panel title={`${events.length} event${events.length === 1 ? "" : "s"}`} scroll={events.length > 0}>
        {events.length === 0 ? (
          <Empty title="Nothing here">
            {shop
              ? "No events for that store. If a merchant says they entered a code, the app never sent it."
              : "The Growsearch app has not sent us anything yet. Check AFFILIATE_INGEST_SECRET matches on both sides."}
          </Empty>
        ) : (
          <Table caption="Events received from the Growsearch app">
            <Head>
              <Th>Received</Th>
              <Th>Type</Th>
              <Th>Store</Th>
              <Th>Outcome</Th>
            </Head>
            <Body>
              {events.map((event) => (
                <Row key={event.id}>
                  <RowHeader>
                    <span className="text-[14px] whitespace-nowrap text-body-mute tabular-nums">
                      {event.receivedAt.toISOString().replace("T", " ").slice(0, 16)}
                    </span>
                  </RowHeader>
                  <Td>
                    <code className="text-[14px]">{event.type}</code>
                  </Td>
                  <Td>{event.shop ?? <span className="text-muted">—</span>}</Td>
                  <Td>
                    {event.outcome ? (
                      <>
                        <code
                          className={`text-[14px] ${
                            event.outcome.startsWith("applied") ? "text-brand" : "text-body-mute"
                          }`}
                        >
                          {event.outcome}
                        </code>
                        {helpFor(event.outcome) && (
                          <span className="mt-0.5 block max-w-[46ch] text-[13px] leading-snug text-muted">
                            {helpFor(event.outcome)}
                          </span>
                        )}
                      </>
                    ) : (
                      /* An event row with no outcome means the transaction that
                         would have written one did not commit — so this is a
                         crash, not a decision, and the sender's retry has not
                         landed yet. */
                      <span className="text-muted">not processed</span>
                    )}
                  </Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>
    </div>
  );
}
