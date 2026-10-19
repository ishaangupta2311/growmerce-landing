"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowRight, Search, Star } from "lucide-react";

import { setStarredAction } from "@/app/admin/_actions/apps";
import { LocalTime, useToast } from "@/components/admin/overlay";
import { EmptyState } from "@/components/admin/ui";
import { clsx } from "@/lib/clsx";
import { storeHref } from "@/lib/apps/paths";
import { PLATFORM_LABEL, type Platform, type StoreRow } from "@/lib/apps/types";
import { PlatformChip, Sparkline } from "./bits";

/**
 * An app's stores: starred ones pinned on top, then the rest, filtered on the
 * page. The list is the app's whole answer, so filtering never asks it again.
 */

type StatusFilter = "active" | "uninstalled";

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-zinc-100 p-[3px]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={clsx(
            "rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-brand",
            value === option.value ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StarButton({
  appId,
  store,
  starred,
  onChange,
}: {
  appId: string;
  store: { id: string; name: string };
  starred: boolean;
  onChange?: (starred: boolean) => void;
}) {
  const notify = useToast();
  const [shown, setShown] = useState(starred);
  const [pending, startTransition] = useTransition();

  /* The server's answer wins once it arrives (a refresh after the action). */
  const [last, setLast] = useState(starred);
  if (last !== starred) {
    setLast(starred);
    setShown(starred);
  }

  return (
    <button
      type="button"
      aria-pressed={shown}
      aria-label={shown ? `Unstar ${store.name}` : `Star ${store.name}`}
      title={shown ? "Starred: pinned to the top" : "Star to pin to the top"}
      disabled={pending}
      onClick={() => {
        const next = !shown;
        setShown(next);
        onChange?.(next);
        startTransition(async () => {
          const result = await setStarredAction(appId, store.id, next);
          if (!result.ok) {
            setShown(!next);
            onChange?.(!next);
            notify(result.error, "error");
          }
        });
      }}
      className="grid size-7 place-items-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-amber-500 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60"
    >
      <Star className={clsx("size-4", shown && "fill-amber-400 text-amber-500")} />
    </button>
  );
}

function SearchesCell({ store }: { store: StoreRow }) {
  const activity = store.activity;
  if (!activity) return <span className="text-zinc-400" title="The app has no count for this store.">-</span>;
  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      {activity.daily && (
        <span className="hidden sm:contents">
          <Sparkline values={activity.daily} label={`${store.name}: ${activity.label} per day, last 30 days`} />
        </span>
      )}
      {activity.total.toLocaleString()}
      {activity.period === "month" && <span className="text-xs text-zinc-500">this month</span>}
    </span>
  );
}

export default function StoreTable({
  appId,
  platforms,
  stores,
}: {
  appId: string;
  platforms: Platform[];
  stores: StoreRow[];
}) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<"all" | Platform>("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  /* Stars change here before the server confirms, so a starred store moves up at once. */
  const [starOverrides, setStarOverrides] = useState<Map<string, boolean>>(new Map());

  const rows = useMemo(
    () => stores.map((store) => ({ ...store, starred: starOverrides.get(store.id) ?? store.starred })),
    [stores, starOverrides],
  );

  const inPlatform = rows.filter((store) => platform === "all" || store.platform === platform);
  const needle = query.trim().toLowerCase();
  const visible = inPlatform
    .filter((store) => store.status === status)
    .filter((store) => !needle || store.name.toLowerCase().includes(needle) || store.domain.toLowerCase().includes(needle))
    .sort((a, b) => (b.activity?.total ?? -1) - (a.activity?.total ?? -1) || a.name.localeCompare(b.name));
  const starredRows = visible.filter((store) => store.starred);
  const otherRows = visible.filter((store) => !store.starred);

  const platformOptions = [
    { value: "all" as const, label: `All ${rows.length}` },
    ...platforms.map((value) => ({
      value,
      label: `${PLATFORM_LABEL[value]} ${rows.filter((store) => store.platform === value).length}`,
    })),
  ];
  const count = (value: StatusFilter) => inPlatform.filter((store) => store.status === value).length;

  const renderRow = (store: StoreRow) => (
    <tr key={store.id} className={clsx("border-b border-zinc-100 last:border-0", store.starred && "bg-orange-50/40")}>
      <td className="w-10 py-2.5 pr-0 pl-3">
        <StarButton
          appId={appId}
          store={store}
          starred={store.starred}
          onChange={(starred) => setStarOverrides((map) => new Map(map).set(store.id, starred))}
        />
      </td>
      <td className="max-w-0 min-w-36 px-3 py-2.5 sm:w-[38%]">
        <div className="flex min-w-0 items-center gap-2">
          {store.dashboard ? (
            <Link href={storeHref(appId, store.id)} className="truncate font-bold text-zinc-900 hover:text-brand">
              {store.name}
            </Link>
          ) : (
            <span className="truncate font-bold text-zinc-900">{store.name}</span>
          )}
          <PlatformChip platform={store.platform} small />
        </div>
        <p className="truncate text-xs text-zinc-500">{store.domain}</p>
      </td>
      <td className="hidden px-3 py-2.5 whitespace-nowrap text-zinc-700 md:table-cell">{store.plan ?? "-"}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <SearchesCell store={store} />
      </td>
      <td className="hidden px-3 py-2.5 whitespace-nowrap text-zinc-500 lg:table-cell">
        <LocalTime iso={status === "active" ? store.since : store.inactiveSince} mode="date" />
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        {store.dashboard ? (
          <Link
            href={storeHref(appId, store.id)}
            aria-label={`View dashboard for ${store.name}`}
            className="inline-flex items-center gap-1 text-[12.5px] font-bold text-brand hover:underline"
          >
            <span className="hidden sm:inline">View dashboard</span>
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        ) : (
          <span className="text-xs font-semibold text-zinc-400">
            No dashboard<span className="hidden sm:inline"> yet</span>
          </span>
        )}
      </td>
    </tr>
  );

  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-zinc-100 p-3 sm:px-4">
        <label className="relative min-w-48 flex-1">
          <span className="sr-only">Search stores</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stores by name or address"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pr-3 pl-8 text-sm shadow-xs outline-none placeholder:text-zinc-400 focus:border-brand focus:ring-3 focus:ring-brand/15"
          />
        </label>
        {platforms.length > 1 && (
          <SegmentedControl label="Platform" value={platform} options={platformOptions} onChange={setPlatform} />
        )}
        <SegmentedControl
          label="Status"
          value={status}
          options={[
            { value: "active", label: `Active ${count("active")}` },
            { value: "uninstalled", label: `Uninstalled ${count("uninstalled")}` },
          ]}
          onChange={setStatus}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Search className="size-5" />} title={stores.length ? "No matching stores" : "No stores yet"}>
          {stores.length
            ? "Try another search, platform or status."
            : "Stores appear here as merchants install the app."}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/70 text-left text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                <th className="w-10 py-2 pl-3" aria-label="Starred" />
                <th className="px-3 py-2">Store</th>
                <th className="hidden px-3 py-2 md:table-cell">Plan</th>
                <th className="px-3 py-2">Searches (30d)</th>
                <th className="hidden px-3 py-2 lg:table-cell">{status === "active" ? "First seen" : "Uninstalled"}</th>
                <th className="px-3 py-2">
                  <span className="sr-only">Dashboard</span>
                </th>
              </tr>
            </thead>
            {starredRows.length > 0 && (
              <tbody>
                <tr>
                  <th colSpan={6} scope="colgroup" className="bg-orange-50/70 px-3 py-1.5 text-left text-[11px] font-extrabold tracking-wider text-brand uppercase">
                    Starred
                  </th>
                </tr>
                {starredRows.map(renderRow)}
              </tbody>
            )}
            {otherRows.length > 0 && (
              <tbody>
                {starredRows.length > 0 && (
                  <tr>
                    <th colSpan={6} scope="colgroup" className="bg-zinc-50 px-3 py-1.5 text-left text-[11px] font-extrabold tracking-wider text-zinc-500 uppercase">
                      All other stores
                    </th>
                  </tr>
                )}
                {otherRows.map(renderRow)}
              </tbody>
            )}
          </table>
        </div>
      )}
    </section>
  );
}
