import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Settings } from "lucide-react";

import { AppIcon, PlatformChip, StatusChip } from "@/components/admin/apps/bits";
import StoreTable from "@/components/admin/apps/StoreTable";
import { LocalTime } from "@/components/admin/overlay";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";
import { appSecret, fetchStores } from "@/lib/apps/connection";
import { getApp, starredStores } from "@/lib/apps/store";
import { percentChange, QUIET_DAYS, summarize } from "@/lib/apps/summary";
import type { AppRow } from "@/lib/apps/types";
import { allows, appKey, APP_SETTINGS, type Grant } from "@/lib/team/permissions";

export async function generateMetadata({ params }: PageProps<"/admin/apps/[appId]">): Promise<Metadata> {
  /* Checked here too, so the tab title never names an app the role cannot see. */
  const { appId } = await params;
  await requireAccess(appKey(appId));
  const app = await getApp(appId);
  return { title: app?.name ?? "App" };
}

/**
 * One app: how many stores use it, and every store, starred ones first. The
 * header draws at once; the figures wait for the app, which may be waking up.
 */
export default async function AppPage({ params }: PageProps<"/admin/apps/[appId]">) {
  const { appId } = await params;
  const { grant } = await requireAccess(appKey(appId));
  const app = await getApp(appId);
  if (!app) notFound();
  const canSettings = allows(grant, APP_SETTINGS);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/apps", label: "Your apps" }}
        title={
          <span className="flex items-center gap-3">
            <AppIcon app={app} size="lg" />
            {app.name}
          </span>
        }
        description={
          <span className="flex flex-wrap gap-1.5 pt-1">
            {app.platforms.map((platform) => (
              <PlatformChip key={platform} platform={platform} />
            ))}
          </span>
        }
        actions={
          canSettings && (
            <ButtonLink href={`/admin/apps/${app.id}/settings`}>
              <Settings className="size-4" />
              App settings
            </ButtonLink>
          )
        }
      />
      <Suspense fallback={<StoresLoading name={app.name} />}>
        <AppStores app={app} grant={grant} />
      </Suspense>
    </>
  );
}

function StoresLoading({ name }: { name: string }) {
  return (
    <div aria-busy="true" className="space-y-4">
      <p className="text-sm text-zinc-500">Asking {name} for its stores. A sleeping app can take up to a minute to wake.</p>
      <div className="grid animate-pulse grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[104px] rounded-xl border border-zinc-200 bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-zinc-200 bg-white" />
    </div>
  );
}

function Stat({ label, value, note, tone = "muted" }: { label: string; value: string; note?: string; tone?: "good" | "warn" | "muted" }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-zinc-900 tabular-nums">{value}</p>
      {note && (
        <p
          className={
            tone === "good"
              ? "mt-0.5 text-xs font-semibold text-emerald-600"
              : tone === "warn"
                ? "mt-0.5 text-xs font-semibold text-amber-700"
                : "mt-0.5 text-xs font-semibold text-zinc-500"
          }
        >
          {note}
        </p>
      )}
    </div>
  );
}

async function AppStores({ app, grant }: { app: AppRow; grant: Grant }) {
  const canSettings = allows(grant, APP_SETTINGS);
  if (!appSecret(app)) {
    return (
      <Card title="Not connected yet">
        <EmptyState
          title={`${app.secretEnv} is not set`}
          action={canSettings && <ButtonLink href={`/admin/apps/${app.id}/settings`}>Open app settings</ButtonLink>}
        >
          Set the same secret on {app.name} and on this site, then reload. Until then the admin cannot ask {app.name}{" "}
          for its stores.
        </EmptyState>
      </Card>
    );
  }

  const [answer, starred] = await Promise.all([fetchStores(app), starredStores(app.id)]);
  if (!answer.ok) {
    return (
      <Card title={`Couldn't reach ${app.name}`}>
        <EmptyState
          title={answer.error}
          action={canSettings && <ButtonLink href={`/admin/apps/${app.id}/settings`}>Check the connection</ButtonLink>}
        />
      </Card>
    );
  }

  const { stores, generatedAt } = answer.data;
  const summary = summarize(stores);
  const change = percentChange(summary.searches30d, summary.previous30d);
  const rows = stores.map((store) => ({ ...store, starred: starred.has(store.id) }));

  return (
    <>
      <p className="-mt-3 mb-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <StatusChip tone="ok">Connected</StatusChip>
        <span>
          Figures from <LocalTime iso={generatedAt} />
        </span>
      </p>
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          label="Active stores"
          value={summary.active.toLocaleString()}
          note={summary.newThisMonth ? `+${summary.newThisMonth} this month` : undefined}
          tone="good"
        />
        <Stat
          label="Uninstalled"
          value={summary.uninstalled.toLocaleString()}
          note={summary.uninstalledThisMonth ? `${summary.uninstalledThisMonth} this month` : undefined}
        />
        <Stat
          label="Searches, 30 days"
          value={summary.searches30d.toLocaleString()}
          note={
            [change && `${change} vs the 30 before`, summary.searchesThisMonth && `+${summary.searchesThisMonth.toLocaleString()} WooCommerce this month`]
              .filter(Boolean)
              .join(" · ") || undefined
          }
          tone={change?.startsWith("-") ? "warn" : "good"}
        />
        <Stat
          label={`Quiet for ${QUIET_DAYS} days`}
          value={summary.quiet.toLocaleString()}
          note={summary.quiet ? "Installed, no searches. Worth a check." : "Every installed store is searching."}
          tone={summary.quiet ? "warn" : "muted"}
        />
      </div>
      <StoreTable appId={app.id} platforms={app.platforms} stores={rows} canStar={allows(grant, appKey(app.id), "edit")} />
    </>
  );
}
