import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAdmin } from "@/app/admin/_actions/auth";
import { PasswordForm } from "@/components/admin/account/forms";
import { Card } from "@/components/admin/ui";
import { requireTeamLogin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Choose a password" };

/**
 * Straight after signing in with a password somebody else chose — a login
 * created for them, or a reset — and before anything else in the admin.
 */
export default async function ForcedPasswordPage() {
  const { standing, secondFactorPassed } = await requireTeamLogin();
  if (!secondFactorPassed) redirect("/admin/verify");
  if (!standing.mustChangePassword) redirect("/admin");

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight">Choose your own password</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        You signed in with a temporary password. Choose one only you know before you continue.
      </p>
      <Card>
        <PasswordForm requireCurrent={false} then="/admin" />
      </Card>
      <form action={signOutAdmin} className="mt-4 text-center">
        <button type="submit" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900">
          Log out
        </button>
      </form>
    </>
  );
}
