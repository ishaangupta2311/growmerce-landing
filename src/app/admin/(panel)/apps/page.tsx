import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, Plus, Settings } from "lucide-react";

import { AppIcon, PlatformChip, StatusChip } from "@/components/admin/apps/bits";
import { ButtonLink, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { clsx } from "@/lib/clsx";
import { appSecret, fetchStores } from "@/lib/apps/connection";
import { listApps, starCounts } from "@/lib/apps/store";
import { compactNumber, summarize } from "@/lib/apps/summary";
import type { AppRow } from "@/lib/apps/types";
import { allows, allowsApps, appKey, APP_SETTINGS } from "@/lib/team/permissions";

export const metadata: Metadata = { title: "Your apps" };

/**
 * Every app Growmerce has built, one card each. A card's figures come from
 * the app itself, which may be asleep, so each streams in on its own and a
 * slow app never holds up the others.
 *
 * Your apps has no permission of its own: it is open to anybody who can see
 * one of the apps, or app settings. Each app's card shows only to a role that
 * can see that app; a role with app settings but not the app gets a smaller
 * card that opens the settings.
 */
export default async function YourAppsPage() {
  const { grant } = await requireAdmin();
  if (!allowsApps(grant)) notFound();
  const canSettings = allows(grant, APP_SETTINGS);
  const canAdd = allows(grant, APP_SETTINGS, "edit");

  const [allApps, stars] = await Promise.all([listApps(), starCounts()]);
  const apps = allApps.filter((app) => canSettings || allows(grant, appKey(app.id)));

  return (
    <>
      <PageHeader
        title="Your apps"
        description="Every app you've built, and how many stores use each one."
        actions={
          canAdd && (
            <ButtonLink href="/admin/apps/new" variant="primary">
              <Plus className="size-4" />
              Add an app
            </ButtonLink>
          )
        }
      />
      {apps.length === 0 && !canAdd && <p className="text-sm text-zinc-500">No apps to show yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) =>
          allows(grant, appKey(app.id)) ? (
            <AppCard key={app.id} app={app} starred={stars.get(app.id) ?? 0} settings={canSettings} />
          ) : (
            <SettingsOnlyCard key={app.id} app={app} />
          ),
        )}
        {canAdd && (
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
        )}
      </div>
    </>
  );
}

/** The settings link sits beside the card's link rather than inside it: a link cannot hold another. */
function AppCard({ app, starred, settings }: { app: AppRow; starred: number; settings: boolean }) {
  return (
    <div className="relative">
      <Link
        href={`/admin/apps/${app.id}`}
        className="group flex h-full flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-zinc-300 hover:shadow-sm"
      >
        <div className={clsx("flex items-center gap-3", settings && "pr-9")}>
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
      {settings && (
        <Link
          href={`/admin/apps/${app.id}/settings`}
          aria-label={`${app.name} settings`}
          title="App settings"
          className="absolute top-4 right-4 grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <Settings className="size-4" />
        </Link>
      )}
    </div>
  );
}

/** An app whose settings the role can see but whose stores it cannot. */
function SettingsOnlyCard({ app }: { app: AppRow }) {
  return (
    <Link
      href={`/admin/apps/${app.id}/settings`}
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
      <span className="mt-auto inline-flex items-center gap-1 self-end text-[13px] font-bold text-brand">
        App settings
        <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
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
