import { ToastProvider } from "@/components/admin/overlay";

/**
 * The few admin pages that come before the admin itself: accepting an
 * invite, the second step of signing in, and choosing a password somebody
 * else set. Outside the panel layout on purpose — that layout insists on
 * both of the things these pages exist to finish.
 */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900">
        <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">G</span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold">Growmerce</p>
              <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Admin</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
