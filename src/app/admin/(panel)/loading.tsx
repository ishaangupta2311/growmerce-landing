/**
 * Shown the moment a sidebar link is clicked, while the next page renders on
 * the server. The shell (sidebar, header) stays put; only the content area
 * swaps to this, so a click always answers immediately.
 */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 rounded-lg bg-zinc-200/80" />
        <div className="h-4 w-72 max-w-full rounded bg-zinc-200/60" />
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="h-9 w-full max-w-sm rounded-lg bg-zinc-100" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-14 shrink-0 rounded-md bg-zinc-100" />
              <div className="h-4 flex-1 rounded bg-zinc-100" />
              <div className="hidden h-4 w-24 rounded bg-zinc-100 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
