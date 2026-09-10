import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/affiliate/admin";
import { listPartners, type PartnerFilter } from "@/lib/affiliate/admin-store";
import { formatRate } from "@/lib/affiliate/commission";
import { formatDate, formatMoney } from "@/lib/affiliate/format";
import type { PartnerKind, PartnerStatus } from "@/lib/affiliate/types";
import Empty from "@/components/affiliate/Empty";
import Panel from "@/components/affiliate/Panel";
import { PartnerPill } from "@/components/affiliate/StatusPill";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";

export const metadata: Metadata = { title: "Partners" };

const STATUSES: PartnerStatus[] = ["pending", "approved", "rejected", "suspended"];
const KINDS: PartnerKind[] = ["agency", "influencer"];

/**
 * Everybody on the program.
 *
 * The filters are links carrying search params, not a client-side form. That
 * makes every view of this list a URL somebody can bookmark, paste into Slack
 * — "why is this one still pending?" — or reload without losing. A `<form>`
 * with JavaScript state would be less code and none of that.
 */
export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  /* Validated against the unions rather than passed through: these reach a
     WHERE clause, and while postgres.js parameterises them, a status of
     "banana" silently returning nothing is a worse answer than ignoring it. */
  const status = STATUSES.find((s) => s === params.status);
  const kind = KINDS.find((k) => k === params.kind);
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : undefined;

  const filter: PartnerFilter = { status, kind, q };
  const partners = await listPartners(filter);

  return (
    <div className="space-y-6">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="q"
            className="block font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Name, agency or email"
            className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-4 py-2.5 text-[15px] text-charcoal outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/25"
          />
        </div>
        {/* Carried through the search so filtering by text does not silently
            drop the status filter the person is looking at. */}
        {status && <input type="hidden" name="status" value={status} />}
        {kind && <input type="hidden" name="kind" value={kind} />}
        <button
          type="submit"
          className="rounded-[10px] border border-line bg-white px-4 py-2.5 font-poppins text-[14.5px] font-bold text-charcoal transition-colors hover:border-brand hover:text-brand"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <FilterLink label="Everyone" active={!status} params={{ kind, q }} />
        {STATUSES.map((value) => (
          <FilterLink
            key={value}
            label={value[0].toUpperCase() + value.slice(1)}
            active={status === value}
            params={{ status: value, kind, q }}
          />
        ))}
      </div>

      <Panel
        title={`${partners.length} partner${partners.length === 1 ? "" : "s"}`}
        scroll={partners.length > 0}
      >
        {partners.length === 0 ? (
          <Empty title="Nobody matches that">
            Try a different filter, or clear the search.
          </Empty>
        ) : (
          <Table caption="Affiliate partners">
            <Head>
              <Th>Partner</Th>
              <Th>Program</Th>
              <Th>Status</Th>
              <Th>Rate</Th>
              <Th numeric>Stores</Th>
              <Th numeric>Earned</Th>
              <Th>Joined</Th>
            </Head>
            <Body>
              {partners.map((partner) => (
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
                  <Td>
                    <PartnerPill status={partner.status} />
                  </Td>
                  <Td>{formatRate(partner.commissionRateBps)}</Td>
                  <Td numeric>
                    {partner.referralCount}
                    {partner.activeReferralCount !== partner.referralCount && (
                      <span className="text-muted"> ({partner.activeReferralCount} live)</span>
                    )}
                  </Td>
                  <Td numeric>
                    {partner.headline
                      ? formatMoney(partner.headline.lifetimeCents, partner.headline.currency)
                      : "—"}
                  </Td>
                  <Td>{formatDate(partner.createdAt)}</Td>
                </Row>
              ))}
            </Body>
          </Table>
        )}
      </Panel>
    </div>
  );
}

function FilterLink({
  label,
  active,
  params,
}: {
  label: string;
  active: boolean;
  params: { status?: string; kind?: string; q?: string };
}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();

  return (
    <Link
      href={`/affiliates/admin/partners${query ? `?${query}` : ""}`}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-3.5 py-1.5 font-poppins text-[13.5px] font-bold transition-colors ${
        active
          ? "border-brand bg-cream text-brand"
          : "border-line bg-white text-body-mute hover:border-brand hover:text-brand"
      }`}
    >
      {label}
    </Link>
  );
}
