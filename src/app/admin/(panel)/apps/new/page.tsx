import type { Metadata } from "next";

import AppSettingsForm from "@/components/admin/apps/AppSettingsForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";
import { APP_SETTINGS } from "@/lib/team/permissions";

export const metadata: Metadata = { title: "Add an app" };

export default async function NewAppPage() {
  await requireAccess(APP_SETTINGS, "edit");
  return (
    <>
      <PageHeader
        back={{ href: "/admin/apps", label: "Your apps" }}
        title="Add an app"
        description="Connect another Shopify or WooCommerce app to Your apps."
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AppSettingsForm app={null} />
        <Card title="What the app needs">
          <ol className="list-decimal space-y-2 pl-4 text-[13px] leading-relaxed text-zinc-600">
            <li>
              Answer <code className="font-mono text-xs">POST /api/portal/stores</code> with its store list, and serve a
              read-only dashboard at <code className="font-mono text-xs">/portal/&lt;pass&gt;</code>. Growsearch&rsquo;s{" "}
              <code className="font-mono text-xs">docs/admin-portal-stores.md</code> is the reference.
            </li>
            <li>
              Generate a secret (<code className="font-mono text-xs">openssl rand -hex 32</code>) and set it on the app
              and on this site under the name you give here.
            </li>
            <li>Redeploy this site so it sees the new variable, then open the app&rsquo;s settings to test it.</li>
          </ol>
        </Card>
      </div>
    </>
  );
}
