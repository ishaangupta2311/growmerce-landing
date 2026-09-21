import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/session";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  /* Already signed in (checked against the database, not just the cookie):
     go straight to the dashboard. A lookup failure just shows the form. */
  const admin = await getCurrentAdmin().catch(() => null);
  if (admin) redirect("/admin");

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-zinc-50 px-4 py-12 font-sans">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />
      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-brand text-base font-black text-white shadow-glow">
            G
          </span>
          <div className="leading-tight">
            <p className="text-base font-extrabold text-zinc-900">Growmerce</p>
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Blog admin</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5 sm:p-8">
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Sign in</h1>
          <p className="mt-1 text-sm text-zinc-500">Use your admin account to manage the blog.</p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">Protected area. Access is logged and rate limited.</p>
      </div>
    </main>
  );
}
