"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { clsx } from "@/lib/clsx";
import { Input } from "./ui";

/** A search box whose value lives in `?q=`, so the server does the filtering. */
export default function UrlSearch({ placeholder, className }: { placeholder: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const pushed = useRef(params.get("q") ?? "");

  useEffect(() => {
    if (q === pushed.current) return;
    const timer = window.setTimeout(() => {
      pushed.current = q;
      const next = new URLSearchParams(params.toString());
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      next.delete("page");
      const query = next.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q, params, pathname, router]);

  return (
    <div className={clsx("relative", className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
      <Input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pr-9 pl-9"
      />
      {pending ? (
        <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-zinc-400" />
      ) : (
        q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )
      )}
    </div>
  );
}
