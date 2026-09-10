import type { Metadata } from "next";

import ForgotForm from "@/components/affiliate/forms/ForgotForm";

import AuthShell from "../AuthShell";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPage() {
  return (
    <AuthShell
      title="Reset your password"
      lede="We will email you a link. It is good for one hour and can only be used once."
    >
      <ForgotForm />
    </AuthShell>
  );
}
