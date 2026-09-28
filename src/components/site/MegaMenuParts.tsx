import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { MenuLink } from "./nav-links";

/* The pieces every header mega menu is built from, so Platform, Resources and
   Why us share one set of type sizes, spacing, rules and hover states. */

/* Equal thirds in every menu, so the column rules do not move as the reader
   runs across the triggers. */
export const MENU_PANEL = "grid h-full grid-cols-3 px-7 py-5";
export const MENU_COLUMN_FIRST = "pr-8";
export const MENU_COLUMN = "border-l border-line px-8";
export const MENU_COLUMN_LAST = "border-l border-line pl-8";

/* Rows that go somewhere and rows that don't share a box, so a list mixing
   both stays on one rhythm. */
const ROW = "-mx-2.5 flex items-center gap-3.5 rounded-[12px] px-2.5 py-1.5";
export const MENU_ROW_STATIC = ROW;

export const MENU_TILE = "grid size-11 shrink-0 place-items-center rounded-[10px]";

const TINTS = {
  orange: "bg-peach text-brand",
  blue: "bg-[#eaf1fd] text-[#3a6fd8]",
  green: "bg-[#e7f6ee] text-[#2b9a5e]",
  purple: "bg-[#f1ebfb] text-[#7a4bd6]",
} as const;

export type MenuIcon = { icon: LucideIcon; tint: keyof typeof TINTS };

export function TintedTile({ icon: Icon, tint }: MenuIcon) {
  return (
    <span className={`${MENU_TILE} ${TINTS[tint]}`}>
      <Icon aria-hidden strokeWidth={1.75} className="size-5" />
    </span>
  );
}

export function MenuHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[18px] leading-tight font-bold text-charcoal">{title}</h2>
      {note ? <p className="mt-0.5 text-[13px] leading-snug text-body-mute">{note}</p> : null}
    </div>
  );
}

/* Label, optional note and optional icon tile; an arrow only when the row
   goes somewhere. Rows without a tile get a touch more height so a plain
   list is not cramped next to the icon lists. */
export function MenuRow({
  item,
  tile,
  onNavigate,
}: {
  item: MenuLink;
  tile?: React.ReactNode;
  onNavigate: () => void;
}) {
  const body = (
    <>
      {tile}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-tight font-semibold text-charcoal transition-colors group-hover:text-brand">
          {item.label}
        </span>
        {item.note ? (
          <span className="mt-0.5 block text-[13px] leading-snug text-body-mute">{item.note}</span>
        ) : null}
      </span>
      {item.href ? (
        <ChevronRight
          aria-hidden
          strokeWidth={2}
          className="size-4 shrink-0 text-muted transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
        />
      ) : null}
    </>
  );
  const row = `${ROW} ${tile ? "" : "min-h-10"}`;

  return item.href ? (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group ${row} transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
    >
      {body}
    </Link>
  ) : (
    <div className={row}>{body}</div>
  );
}

export function MenuRows({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}
