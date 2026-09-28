import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  CircleCheckBig,
  FileText,
  HandCoins,
  Newspaper,
  Rocket,
  Scale,
  SquarePlay,
  Users,
} from "lucide-react";
import PlatformMegaMenuContent from "./PlatformMegaMenu";
import {
  MENU_COLUMN,
  MENU_COLUMN_FIRST,
  MENU_COLUMN_LAST,
  MENU_PANEL,
  MenuHeading,
  MenuRow,
  MenuRows,
  TintedTile,
  type MenuIcon,
} from "./MegaMenuParts";
import { RESOURCE_GROUPS, WHY_US_GROUPS, type MenuLink } from "./nav-links";

export type HeaderMegaMenuVariant = "platform" | "resources" | "why-us";

const VARIANTS: HeaderMegaMenuVariant[] = ["platform", "resources", "why-us"];

const LABELS: Record<HeaderMegaMenuVariant, string> = {
  platform: "Platform",
  resources: "Resources",
  "why-us": "Why us",
};

const COLUMNS = [MENU_COLUMN_FIRST, MENU_COLUMN, MENU_COLUMN_LAST];

const ICONS: Record<string, MenuIcon> = {
  "learn-started": { icon: BookOpen, tint: "blue" },
  "learn-blogs": { icon: Newspaper, tint: "purple" },
  "learn-videos": { icon: SquarePlay, tint: "orange" },
  "use-started": { icon: Rocket, tint: "orange" },
  "use-blogs": { icon: FileText, tint: "green" },
  "use-videos": { icon: SquarePlay, tint: "orange" },
  "use-community": { icon: Users, tint: "blue" },
  compare: { icon: Scale, tint: "blue" },
  fit: { icon: CircleCheckBig, tint: "green" },
  about: { icon: Building2, tint: "orange" },
  affiliates: { icon: HandCoins, tint: "green" },
  "proof-blogs": { icon: Newspaper, tint: "purple" },
  "proof-videos": { icon: SquarePlay, tint: "orange" },
};

function LinkColumn({
  group,
  className,
  onNavigate,
}: {
  group: { title: string; links: MenuLink[] };
  className: string;
  onNavigate: () => void;
}) {
  return (
    <div className={className}>
      <MenuHeading title={group.title} />
      <MenuRows>
        {group.links.map((link) => (
          <MenuRow key={link.id} item={link} tile={<TintedTile {...ICONS[link.id]} />} onNavigate={onNavigate} />
        ))}
      </MenuRows>
    </div>
  );
}

function Panel({
  variant,
  scope,
  onNavigate,
}: {
  variant: HeaderMegaMenuVariant;
  scope: "growmerce" | "growsearch";
  onNavigate: () => void;
}) {
  if (variant === "platform") return <PlatformMegaMenuContent scope={scope} onNavigate={onNavigate} />;

  if (variant === "resources") {
    return (
      <div className={MENU_PANEL}>
        {RESOURCE_GROUPS.map((group, i) => (
          <LinkColumn key={group.title} group={group} className={COLUMNS[i]} onNavigate={onNavigate} />
        ))}
        <div className={MENU_COLUMN_LAST}>
          <MenuHeading title="Read it" />
          <Link
            href="/blog"
            onClick={onNavigate}
            className="group block overflow-hidden rounded-[12px] border border-line bg-white p-2 transition-shadow duration-200 hover:shadow-[0_16px_34px_-22px_rgba(255,90,31,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span className="relative block aspect-[2/1] overflow-hidden rounded-[8px] bg-cream">
              <Image
                src="/img/pages/hero-shopping-thumb.png"
                alt="Growmerce ecommerce article"
                fill
                sizes="340px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
              />
            </span>
            <span className="mt-2 block px-1 text-[13px] leading-snug text-body-mute transition-colors group-hover:text-brand">
              The Growmerce blog
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={MENU_PANEL}>
      {WHY_US_GROUPS.map((group, i) => (
        <LinkColumn key={group.title} group={group} className={COLUMNS[i]} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

/* The panel continues the header: same cream, no seam at the top, and only
   its lower corners rounded, so it reads as the header opening downwards.

   Every menu is drawn, stacked in one grid cell, and only the open one is
   shown. The cell is as tall as the tallest of them, so the panel keeps one
   height as the pointer runs across the triggers — at every width, without a
   number to keep in step with the content. The hidden ones are inert, so
   neither the keyboard nor a screen reader reaches them. */
export default function HeaderMegaMenu({
  variant,
  scope,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: {
  variant: HeaderMegaMenuVariant;
  scope: "growmerce" | "growsearch";
  onNavigate: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div
      id="header-mega-menu"
      role="region"
      aria-label={`${LABELS[variant]} menu`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="mega-menu-enter fixed top-[84px] left-1/2 z-60 grid w-[calc(100vw-64px)] max-w-[1300px] rounded-b-[24px] border-x border-b border-line/80 bg-cream font-bricolage shadow-[0_30px_70px_-30px_rgba(73,28,8,0.32)]"
    >
      {VARIANTS.map((v) => (
        <div
          key={v}
          inert={v !== variant}
          aria-hidden={v !== variant || undefined}
          className={`col-start-1 row-start-1 ${v === variant ? "" : "invisible"}`}
        >
          <Panel variant={v} scope={scope} onNavigate={onNavigate} />
        </div>
      ))}
    </div>
  );
}
