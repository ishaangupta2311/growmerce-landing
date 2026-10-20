import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAdmin } from "@/app/admin/_actions/auth";
import { SignInCodeForm } from "@/components/admin/account/forms";
import { Card } from "@/components/admin/ui";
import { requireTeamLogin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Two-step login" };

/** The second step of signing in, for a teammate with two-step login on. */
export default async function VerifyPage() {
  const { email, secondFactorPassed } = await requireTeamLogin();
  if (secondFactorPassed) redirect("/admin");

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight">Enter your code</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">Open your authenticator app for the 6-digit code for {email}.</p>
      <Card>
        <SignInCodeForm />
      </Card>
      <form action={signOutAdmin} className="mt-4 text-center">
        <button type="submit" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900">
          Not you? Log out
        </button>
      </form>
    </>
  );
}
