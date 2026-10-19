import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Eye, ExternalLink } from "lucide-react";

import { PlatformChip, StatusChip } from "@/components/admin/apps/bits";
import { DashboardFrame, ReloadViewButton, StoreSwitcher } from "@/components/admin/apps/DashboardFrame";
import { StarButton } from "@/components/admin/apps/StoreTable";
import { LocalTime } from "@/components/admin/overlay";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { appSecret, dashboardUrl, fetchStores } from "@/lib/apps/connection";
import { storeIdFromSegment } from "@/lib/apps/paths";
import { getApp, starredStores } from "@/lib/apps/store";
import type { AppRow } from "@/lib/apps/types";

export const metadata: Metadata = { title: "Store dashboard" };

/**
 * One store's dashboard, exactly as its merchant sees it in the app, framed
 * read-only. The pass in the frame's address lasts half an hour; rendering
 * this page mints a new one.
 */
export default async function StorePage({ params }: PageProps<"/admin/apps/[appId]/stores/[storeId]">) {
  await requireAdmin();
  const { appId, storeId: segment } = await params;
  const storeId = storeIdFromSegment(segment);
  const app = await getApp(appId);
  if (!app) notFound();

  return (
    <>
      <PageHeader back={{ href: `/admin/apps/${app.id}`, label: app.name }} title="Store dashboard" />
      <Suspense fallback={<div aria-busy="true" className="h-[520px] animate-pulse rounded-xl border border-zinc-200 bg-white" />}>
        <StoreDashboard app={app} storeId={storeId} />
      </Suspense>
    </>
  );
}

async function StoreDashboard({ app, storeId }: { app: AppRow; storeId: string }) {
  if (!appSecret(app)) {
    return (
      <Card title="Not connected yet">
        <EmptyState title={`${app.secretEnv} is not set`} action={<ButtonLink href={`/admin/apps/${app.id}/settings`}>Open app settings</ButtonLink>} />
      </Card>
    );
  }

  const [answer, starred] = await Promise.all([fetchStores(app), starredStores(app.id)]);
  if (!answer.ok) {
    return (
      <Card title={`Couldn't reach ${app.name}`}>
        <EmptyState title={answer.error} />
      </Card>
    );
  }

  const store = answer.data.stores.find((candidate) => candidate.id === storeId);
  if (!store) notFound();
  const src = store.dashboard ? dashboardUrl(app, store.id) : null;
  const switchable = answer.data.stores
    .filter((candidate) => candidate.dashboard)
    .sort((a, b) => Number(starred.has(b.id)) - Number(starred.has(a.id)) || a.name.localeCompare(b.name))
    .map((candidate) => ({ id: candidate.id, name: candidate.name }));

  const facts = [
    { label: "Plan", value: store.plan ?? "-" },
    { label: store.status === "active" ? "First seen" : "Uninstalled", value: <LocalTime iso={store.status === "active" ? store.since : store.inactiveSince} mode="date" /> },
    {
      label: store.activity?.period === "month" ? "Searches this month" : "Searches, 30 days",
      value: store.activity ? store.activity.total.toLocaleString() : "-",
    },
  ];

  return (
    <div className="space-y-3">
      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-extrabold text-zinc-900">{store.name}</h2>
            <StarButton appId={app.id} store={store} starred={starred.has(store.id)} />
            <PlatformChip platform={store.platform} />
            {store.status === "uninstalled" && <StatusChip tone="off">Uninstalled</StatusChip>}
          </div>
          <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-1">
                <dt>{fact.label}</dt>
                <dd className="font-semibold text-zinc-800">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StoreSwitcher appId={app.id} current={store.id} stores={switchable} />
          <ButtonLink href={`https://${store.domain}`} target="_blank" rel="noreferrer" size="md">
            Open their store
            <ExternalLink className="size-4" />
          </ButtonLink>
        </div>
      </section>

      {src ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-sky-100 bg-sky-50 px-3.5 py-2 text-[13px] text-sky-900">
            <span className="inline-flex items-center gap-2">
              <Eye aria-hidden className="size-4 shrink-0" />
              You&rsquo;re seeing exactly what this store owner sees in {app.name}. Read-only: nothing here changes their store.
            </span>
            <ReloadViewButton />
          </div>
          <DashboardFrame src={src} title={`${app.name} dashboard for ${store.name}`} />
        </>
      ) : (
        <Card>
          <EmptyState title="No dashboard for this store yet">
            {app.name} doesn&rsquo;t offer a dashboard for {store.platform === "woocommerce" ? "WooCommerce" : "this kind of"} store.
          </EmptyState>
        </Card>
      )}
    </div>
  );
}
