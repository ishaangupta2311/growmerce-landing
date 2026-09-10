import type { Metadata } from "next";

import SignUpForm from "@/components/affiliate/forms/SignUpForm";

import AuthShell from "../AuthShell";

export const metadata: Metadata = { title: "Apply to the affiliate program" };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Join the Growmerce affiliate program"
      lede="Two minutes to apply. We read every application by hand, so you will hear back from a person."
    >
      <SignUpForm />
    </AuthShell>
  );
}
