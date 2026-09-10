import type { Metadata } from "next";

import ResetForm from "@/components/affiliate/forms/ResetForm";

import AuthShell from "../AuthShell";

export const metadata: Metadata = { title: "Choose a new password" };

/**
 * Reached only through the emailed recovery link, which passes through
 * `/affiliates/auth/callback` first — that is what turns the one-time token
 * into the session this page's action needs. Landing here directly shows the
 * form and then, correctly, refuses to save.
 */
export default function ResetPage() {
  return (
    <AuthShell
      title="Choose a new password"
      lede="Then we will take you straight to your dashboard."
    >
      <ResetForm />
    </AuthShell>
  );
}
