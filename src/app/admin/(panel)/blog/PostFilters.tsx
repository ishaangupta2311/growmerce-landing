"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { Input, Select } from "@/components/admin/ui";
import { POST_SORTS, type Option } from "@/lib/blog/types";

/**
 * Filters live in the URL, so a filtered view can be bookmarked, shared and
 * survives a reload; the server page reads them back and queries.
 */
export default function PostFilters({ categories }: { categories: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const lastPushed = useRef(params.get("q") ?? "");

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const query = next.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  /* Search as you type, without a request per keystroke. */
  useEffect(() => {
    if (q === lastPushed.current) return;
    const timer = window.setTimeout(() => {
      lastPushed.current = q;
      update({ q: q.trim() });
    }, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `update` reads the latest params on each call
  }, [q]);

  return (
    <div className="flex flex-col gap-2 border-b border-zinc-100 p-3 sm:p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search by title or slug…"
          aria-label="Search posts"
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex">
        <Select
          aria-label="Filter by status"
          value={params.get("status") ?? ""}
          onChange={(event) => update({ status: event.target.value })}
          className="lg:w-40"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </Select>
        <Select
          aria-label="Filter by category"
          value={params.get("category") ?? ""}
          onChange={(event) => update({ category: event.target.value })}
          className="lg:w-44"
        >
          <option value="">All categories</option>
          <option value="none">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Sort posts"
          value={params.get("sort") ?? "updated_desc"}
          onChange={(event) => update({ sort: event.target.value === "updated_desc" ? "" : event.target.value })}
          className="lg:w-48"
        >
          {Object.entries(POST_SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
