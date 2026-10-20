import type { Metadata } from "next";

import { PasswordForm, ProfileCard, TwoStepCard } from "@/components/admin/account/forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin, requireTeamLogin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "My account" };

/** Your own name, password and two-step login. Every teammate has this page, whatever their role. */
export default async function AccountPage() {
  const admin = await requireAdmin();
  const { hasSecondFactor } = await requireTeamLogin();

  return (
    <>
      <PageHeader title="My account" description="Your name, your password and how you sign in." />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <ProfileCard name={admin.name} email={admin.email} roleName={admin.roleName} />
          <TwoStepCard enabled={hasSecondFactor} />
        </div>
        <Card title="Password">
          <PasswordForm requireCurrent />
        </Card>
      </div>
    </>
  );
}
