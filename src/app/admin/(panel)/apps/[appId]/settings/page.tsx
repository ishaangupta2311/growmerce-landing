import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StatusChip } from "@/components/admin/apps/bits";
import AppSettingsForm, { RemoveAppCard, TestAgainButton } from "@/components/admin/apps/AppSettingsForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { appSecret, checkConnection } from "@/lib/apps/connection";
import { getApp } from "@/lib/apps/store";
import { PLATFORM_LABEL, type AppRow, type Platform } from "@/lib/apps/types";

export const metadata: Metadata = { title: "App settings" };

export default async function AppSettingsPage({ params }: PageProps<"/admin/apps/[appId]/settings">) {
  await requireAdmin();
  const app = await getApp((await params).appId);
  if (!app) notFound();

  return (
    <>
      <PageHeader
        back={{ href: `/admin/apps/${app.id}`, label: app.name }}
        title="App settings"
        description={`How the admin finds ${app.name} and proves it's you.`}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AppSettingsForm app={app} />
        <div className="space-y-5">
          <Card title="Connection check" description="Runs each time this page opens.">
            <Suspense fallback={<p className="text-sm text-zinc-500">Asking {app.name}… A sleeping app can take up to a minute.</p>}>
              <ConnectionCheck app={app} />
            </Suspense>
            <div className="mt-3">
              <TestAgainButton />
            </div>
          </Card>
          <RemoveAppCard app={app} />
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2.5 text-[13px] last:border-0">
      <span className="text-zinc-700">{label}</span>
      {children}
    </div>
  );
}

async function ConnectionCheck({ app }: { app: AppRow }) {
  if (!appSecret(app)) {
    return (
      <div>
        <Row label="Secret set here">
          <StatusChip tone="bad">No</StatusChip>
        </Row>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Set <code className="font-mono">{app.secretEnv}</code> on this site, and the same value on {app.name}, then
          redeploy.
        </p>
      </div>
    );
  }

  const { answer, ms } = await checkConnection(app);

  if (!answer.ok) {
    return (
      <div>
        <Row label="Secret set here">
          <StatusChip tone="ok">Yes</StatusChip>
        </Row>
        <Row label="App answers">
          <StatusChip tone="bad">No</StatusChip>
        </Row>
        <p className="mt-2 text-xs leading-relaxed text-red-700">{answer.error}</p>
      </div>
    );
  }

  const { stores } = answer.data;
  const dashboards = [...new Set(stores.filter((store) => store.dashboard).map((store) => store.platform))];
  return (
    <div>
      <Row label="Secret set here">
        <StatusChip tone="ok">Yes</StatusChip>
      </Row>
      <Row label="App answers">
        <StatusChip tone="ok">Yes · {ms.toLocaleString()} ms</StatusChip>
      </Row>
      <Row label="Store list">
        <StatusChip tone="ok">
          {stores.length} store{stores.length === 1 ? "" : "s"}
        </StatusChip>
      </Row>
      <Row label="Dashboards">
        {dashboards.length ? (
          <StatusChip tone="ok">
            {dashboards.map((platform) => PLATFORM_LABEL[platform as Platform] ?? platform).join(", ")}
          </StatusChip>
        ) : (
          <StatusChip tone="off">None yet</StatusChip>
        )}
      </Row>
    </div>
  );
}
