import { clsx } from "@/lib/clsx";
import { PLATFORM_LABEL, type AppRow, type Platform } from "@/lib/apps/types";

/**
 * Small pieces the Your apps pages share. No state, so server and client
 * components can both use them.
 */

/** The app's icon on a white tile, or its initial when it has none. */
export function AppIcon({ app, size = "md" }: { app: Pick<AppRow, "name" | "iconUrl">; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-12 rounded-xl" : "size-11 rounded-[11px]";
  if (!app.iconUrl) {
    return (
      <span aria-hidden className={clsx(box, "grid shrink-0 place-items-center bg-brand text-lg font-black text-white")}>
        {app.name.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );
  }
  return (
    <span aria-hidden className={clsx(box, "grid shrink-0 place-items-center border border-zinc-200 bg-white p-2")}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a small icon from anywhere an admin points; nothing for the optimiser to do */}
      <img src={app.iconUrl} alt="" className="size-full object-contain" />
    </span>
  );
}

const PLATFORM_STYLE: Record<Platform, string> = {
  shopify: "bg-emerald-50 text-emerald-700",
  woocommerce: "bg-purple-50 text-purple-700",
};

export function PlatformChip({ platform, small = false }: { platform: string; small?: boolean }) {
  const known = platform in PLATFORM_LABEL ? (platform as Platform) : null;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-bold whitespace-nowrap",
        small ? "px-1.5 py-px text-[10.5px]" : "px-2 py-0.5 text-[11.5px]",
        known ? PLATFORM_STYLE[known] : "bg-zinc-100 text-zinc-700",
      )}
    >
      {known ? PLATFORM_LABEL[known] : platform}
    </span>
  );
}

const TONE = {
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  off: "bg-zinc-100 text-zinc-600",
} as const;

export function StatusChip({ tone, children }: { tone: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-bold whitespace-nowrap",
        TONE[tone],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** A store's last 30 days, oldest first. Green when the last week beats the first, red when it falls. */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const width = 64;
  const height = 20;
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - 1 - (value / max) * (height - 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const week = Math.min(7, Math.floor(values.length / 2));
  const sum = (list: number[]) => list.reduce((total, value) => total + value, 0);
  const falling = sum(values.slice(-week)) < sum(values.slice(0, week));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={falling ? "#ef4444" : "#10b981"}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
