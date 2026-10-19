"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, RotateCw } from "lucide-react";

import { storeHref } from "@/lib/apps/paths";
import { Button, Select } from "@/components/admin/ui";

/**
 * The app's own dashboard for one store, framed. The app reports its page
 * height (see app/portal/layout.jsx in Growsearch), and the frame grows to
 * fit, so the admin page scrolls rather than a box inside it.
 */

const HEIGHT_MESSAGE = "growsearch:portal-height";
const MIN_HEIGHT = 480;

export function DashboardFrame({ src, title }: { src: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);
  const [loading, setLoading] = useState(true);
  const origin = new URL(src).origin;

  /* A new pass is a new address: show the spinner again until it loads. */
  const [lastSrc, setLastSrc] = useState(src);
  if (lastSrc !== src) {
    setLastSrc(src);
    setLoading(true);
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data as { type?: unknown; height?: unknown } | null;
      if (data?.type !== HEIGHT_MESSAGE || typeof data.height !== "number" || !Number.isFinite(data.height)) return;
      setHeight(Math.max(MIN_HEIGHT, Math.min(Math.ceil(data.height), 20_000)));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [origin]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-[#f1f1f1]">
      {loading && (
        <div className="absolute inset-x-0 top-24 flex justify-center text-sm text-zinc-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-xs">
            <LoaderCircle className="size-4 animate-spin" />
            Loading the dashboard. A sleeping app can take up to a minute.
          </span>
        </div>
      )}
      <iframe
        ref={frame}
        key={src}
        src={src}
        title={title}
        onLoad={() => setLoading(false)}
        style={{ height }}
        className="block w-full border-0"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

/** Mints a fresh pass by rendering the page again, for when the view has expired. */
export function ReloadViewButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
      Reload view
    </Button>
  );
}

export function StoreSwitcher({
  appId,
  current,
  stores,
}: {
  appId: string;
  current: string;
  stores: { id: string; name: string }[];
}) {
  const router = useRouter();
  if (stores.length < 2) return null;
  return (
    <label className="w-56">
      <span className="sr-only">Switch store</span>
      <Select value={current} onChange={(event) => router.push(storeHref(appId, event.target.value))}>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
