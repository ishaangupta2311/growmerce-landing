import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Plus } from "lucide-react";

import { AppIcon, PlatformChip, StatusChip } from "@/components/admin/apps/bits";
import { ButtonLink, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { clsx } from "@/lib/clsx";
import { appSecret, fetchStores } from "@/lib/apps/connection";
import { listApps, starCounts } from "@/lib/apps/store";
import { compactNumber, summarize } from "@/lib/apps/summary";
import type { AppRow } from "@/lib/apps/types";

export const metadata: Metadata = { title: "Your apps" };

/**
 * Every app Growmerce has built, one card each. A card's figures come from
 * the app itself, which may be asleep, so each streams in on its own and a
 * slow app never holds up the others.
 */
export default async function YourAppsPage() {
  await requireAdmin();
  const [apps, stars] = await Promise.all([listApps(), starCounts()]);

  return (
    <>
      <PageHeader
        title="Your apps"
        description="Every app you've built, and how many stores use each one."
        actions={
          <ButtonLink href="/admin/apps/new" variant="primary">
            <Plus className="size-4" />
            Add an app
          </ButtonLink>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} starred={stars.get(app.id) ?? 0} />
        ))}
        <Link
          href="/admin/apps/new"
          className="grid min-h-52 place-items-center rounded-xl border-[1.5px] border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-white"
        >
          <span>
            <span aria-hidden className="mx-auto mb-2.5 grid size-10 place-items-center rounded-[10px] bg-zinc-100 text-zinc-600">
              <Plus className="size-5" />
            </span>
            <span className="block text-sm font-bold text-zinc-900">Add an app</span>
            A Shopify or WooCommerce app that answers the Growmerce connection.
          </span>
        </Link>
      </div>
    </>
  );
}

function AppCard({ app, starred }: { app: AppRow; starred: number }) {
  return (
    <Link
      href={`/admin/apps/${app.id}`}
      className="group flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <AppIcon app={app} />
        <div className="min-w-0">
          <h2 className="truncate text-base font-extrabold text-zinc-900">{app.name}</h2>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {app.platforms.map((platform) => (
              <PlatformChip key={platform} platform={platform} />
            ))}
          </div>
        </div>
      </div>
      <Suspense fallback={<CardFigures stores="…" searches="…" starred={String(starred)} footer={<CardFooter />} />}>
        <AppCardFigures app={app} starred={starred} />
      </Suspense>
    </Link>
  );
}

async function AppCardFigures({ app, starred }: { app: AppRow; starred: number }) {
  if (!appSecret(app)) {
    return (
      <CardFigures
        stores="-"
        searches="-"
        starred={String(starred)}
        footer={<CardFooter status={<StatusChip tone="warn">Not connected</StatusChip>} />}
      />
    );
  }

  const answer = await fetchStores(app);
  if (!answer.ok) {
    return (
      <CardFigures
        stores="-"
        searches="-"
        starred={String(starred)}
        footer={<CardFooter status={<StatusChip tone="bad">Can&rsquo;t reach it</StatusChip>} />}
      />
    );
  }

  const summary = summarize(answer.data.stores);
  return (
    <CardFigures
      stores={String(summary.active)}
      searches={compactNumber(summary.searches30d)}
      starred={String(starred)}
      footer={<CardFooter status={<StatusChip tone="ok">Connected</StatusChip>} />}
    />
  );
}

function CardFigures({
  stores,
  searches,
  starred,
  footer,
}: {
  stores: string;
  searches: string;
  starred: string;
  footer: React.ReactNode;
}) {
  const figures = [
    { label: "Stores", value: stores },
    { label: "Searches/30d", value: searches },
    { label: "Starred", value: starred },
  ];
  return (
    <>
      <dl className="grid grid-cols-3 rounded-[10px] border border-zinc-100">
        {figures.map(({ label, value }, index) => (
          <div
            key={label}
            className={clsx("flex flex-col-reverse px-3 py-2.5", index > 0 && "border-l border-zinc-100")}
          >
            <dt className="text-[11px] font-semibold whitespace-nowrap text-zinc-500">{label}</dt>
            <dd className="text-lg font-extrabold tracking-tight text-zinc-900 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {footer}
    </>
  );
}

function CardFooter({ status }: { status?: React.ReactNode }) {
  return (
    <div className="mt-auto flex items-center justify-between gap-3">
      {status ?? <span className="h-5 w-20 animate-pulse rounded-full bg-zinc-100" />}
      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-brand">
        Open
        <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </div>
  );
}
