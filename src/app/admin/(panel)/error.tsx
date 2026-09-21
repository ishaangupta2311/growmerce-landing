"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/admin/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  /* Production hides server error messages behind a digest; the one message
     worth showing verbatim is the "database not configured" setup hint. */
  const setup = error.message.includes("DATABASE_URL");

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-amber-50 text-amber-600">
        <TriangleAlert className="size-6" />
      </div>
      <h1 className="text-lg font-bold text-zinc-900">{setup ? "Database not configured" : "Something went wrong"}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {setup
          ? error.message
          : "This page could not be loaded. If the database was asleep it usually wakes within a few seconds."}
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-zinc-400">Reference: {error.digest}</p>}
      <Button variant="primary" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
