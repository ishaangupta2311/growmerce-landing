import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  FileText,
  Newspaper,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";
import { ComingSoon, PLATFORMS, PlatformMark, type Platform } from "./PlatformStrip";
import {
  MENU_COLUMN,
  MENU_COLUMN_FIRST,
  MENU_COLUMN_LAST,
  MENU_PANEL,
  MENU_ROW_STATIC,
  MENU_TILE,
  TintedTile,
  type MenuIcon,
  MenuHeading,
  MenuRow,
  MenuRows,
} from "./MegaMenuParts";
import {
  GROWMERCE_EXPLORE,
  GROWMERCE_PLATFORMS,
  GROWSEARCH_EXPLORE,
  GROWSEARCH_PLATFORMS,
  MORE_PRODUCTS,
  PRODUCTS,
  type PlatformName,
  type PlatformRow,
} from "./nav-links";

/* Status comes from PLATFORMS; only the art changes per menu. */
function platformArt(name: PlatformName, art: { src: string; w: number; h: number }): Platform {
  return { ...PLATFORMS.find((p) => p.name === name)!, ...art };
}

/* ─── Growmerce, and every page that is not Growsearch's ─────────────────── */

const GROWMERCE_ICONS: Record<string, MenuIcon> = {
  search: { icon: Search, tint: "orange" },
  assistant: { icon: ShoppingBag, tint: "orange" },
  analytics: { icon: ChartNoAxesColumnIncreasing, tint: "orange" },
  how: { icon: BookOpen, tint: "blue" },
  store: { icon: FileText, tint: "green" },
  blogs: { icon: Newspaper, tint: "purple" },
  webinar: { icon: Users, tint: "orange" },
};

/* The platforms' own marks, sized to sit in the same tile as the icons. */
const GROWMERCE_PLATFORM_TILES: Record<PlatformName, { platform: Platform; tile: string; mark: string }> = {
  Shopify: {
    platform: platformArt("Shopify", { src: "/img/logos/shopify-bag.svg", w: 64, h: 74 }),
    tile: "bg-[#eef6e7]",
    mark: "h-[22px] w-auto",
  },
  WooCommerce: {
    platform: platformArt("WooCommerce", { src: "/img/logos/woo-bubble.svg", w: 54, h: 32 }),
    tile: "bg-[#f4ecf5]",
    mark: "h-auto w-7",
  },
  BigCommerce: {
    platform: platformArt("BigCommerce", { src: "/img/logos/logo-bigcommerce.svg", w: 81, h: 81 }),
    tile: "bg-[#eff0f4]",
    mark: "size-6",
  },
};

function GrowmercePlatformRow({ row }: { row: PlatformRow }) {
  const { platform, tile, mark } = GROWMERCE_PLATFORM_TILES[row.name];
  return (
    <div className={MENU_ROW_STATIC}>
      <span className={`${MENU_TILE} ${tile}`}>
        <PlatformMark platform={platform} className={mark} dim="opacity-65" />
      </span>
      <span className="min-w-0 flex-1">
        {/* The status sits beside the name rather than under it, so an
            unshipped platform's row is no taller than a live one's. */}
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          <span className="text-[15px] leading-tight font-semibold text-charcoal">{row.label}</span>
          {platform.live ? null : <ComingSoon />}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-body-mute">{row.note}</span>
      </span>
    </div>
  );
}

function GrowmercePanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className={MENU_PANEL}>
      <div className={MENU_COLUMN_FIRST}>
        <MenuHeading title="Growmerce" />
        <MenuRows>
          {PRODUCTS.map((item) => (
            <MenuRow key={item.id} item={item} tile={<TintedTile {...GROWMERCE_ICONS[item.id]} />} onNavigate={onNavigate} />
          ))}
        </MenuRows>
      </div>

      <div className={MENU_COLUMN}>
        <MenuHeading title="Platforms" />
        <MenuRows>
          {GROWMERCE_PLATFORMS.map((row) => (
            <GrowmercePlatformRow key={row.name} row={row} />
          ))}
        </MenuRows>
      </div>

      <div className={MENU_COLUMN_LAST}>
        <MenuHeading title="Explore" />
        <MenuRows>
          {GROWMERCE_EXPLORE.map((item) => (
            <MenuRow key={item.id} item={item} tile={<TintedTile {...GROWMERCE_ICONS[item.id]} />} onNavigate={onNavigate} />
          ))}
        </MenuRows>
      </div>
    </div>
  );
}

/* ─── Growsearch ─────────────────────────────────────────────────────────── */

/* The Figma's own glyphs, at their own sizes — they are not square, and a
   shared size would squash the ones that aren't. */
const GROWSEARCH_ICONS: Record<string, { src: string; w: number; h: number }> = {
  search: { src: "/img/menu/search.svg", w: 30, h: 30 },
  assistant: { src: "/img/menu/bag.svg", w: 31, h: 34 },
  analytics: { src: "/img/menu/analytics.svg", w: 34.4999, h: 27.5 },
  how: { src: "/img/menu/book.svg", w: 41, h: 41 },
  store: { src: "/img/menu/file.svg", w: 38, h: 38 },
  blogs: { src: "/img/menu/article.svg", w: 41, h: 41 },
  video: { src: "/img/menu/laptop-video.svg", w: 34.7503, h: 28.4169 },
};

/* The glyphs were drawn for a 49px tile; one factor fits them to ours and
   keeps their relative sizes. */
const GLYPH_SCALE = 0.7;

const GROWSEARCH_WORDMARKS: Record<PlatformName, { platform: Platform; mark: string }> = {
  Shopify: { platform: PLATFORMS.find((p) => p.name === "Shopify")!, mark: "h-6 w-auto" },
  WooCommerce: { platform: PLATFORMS.find((p) => p.name === "WooCommerce")!, mark: "h-[21px] w-auto" },
  BigCommerce: {
    platform: platformArt("BigCommerce", { src: "/img/logos/logo-bigcommerce-wordmark.png", w: 492, h: 112 }),
    mark: "h-7 w-auto",
  },
};

function GlyphTile({ id }: { id: string }) {
  const icon = GROWSEARCH_ICONS[id];
  return (
    <span className={`${MENU_TILE} bg-peach`}>
      <Image
        src={icon.src}
        alt=""
        width={Math.round(icon.w)}
        height={Math.round(icon.h)}
        style={{ width: icon.w * GLYPH_SCALE, height: icon.h * GLYPH_SCALE }}
      />
    </span>
  );
}

function GrowsearchPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className={MENU_PANEL}>
      <div className={MENU_COLUMN_FIRST}>
        <MenuHeading title="Growmerce" note="AI products to grow your ecommerce business" />
        <MenuRows>
          {PRODUCTS.map((item) => (
            <MenuRow key={item.id} item={item} tile={<GlyphTile id={item.id} />} onNavigate={onNavigate} />
          ))}
        </MenuRows>
        <Link
          href={MORE_PRODUCTS.href!}
          onClick={onNavigate}
          className="group mt-3 inline-flex items-center gap-2 rounded-[6px] text-[15px] font-semibold text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {MORE_PRODUCTS.label}
          <ArrowRight aria-hidden strokeWidth={2.2} className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>

      <div className={MENU_COLUMN}>
        <MenuHeading title="Explore" note="Learn, see and get inspired" />
        <MenuRows>
          {GROWSEARCH_EXPLORE.map((item) => (
            <MenuRow key={item.id} item={item} tile={<GlyphTile id={item.id} />} onNavigate={onNavigate} />
          ))}
        </MenuRows>
      </div>

      <div className={MENU_COLUMN_LAST}>
        <MenuHeading title="Platforms" note="Works with the tools you love" />
        <ul className="flex flex-col gap-2">
          {GROWSEARCH_PLATFORMS.map((row) => {
            const { platform, mark } = GROWSEARCH_WORDMARKS[row.name];
            return (
              <li
                key={row.name}
                className="flex min-h-[56px] items-center gap-4 rounded-[12px] border border-line bg-white px-4 py-2"
              >
                <span className="flex w-[40%] shrink-0 items-center">
                  <PlatformMark platform={platform} className={`max-w-full ${mark}`} dim="opacity-65" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-snug text-body-mute">{row.note}</span>
                  {platform.live ? null : <ComingSoon className="mt-0.5" />}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function PlatformMegaMenuContent({
  scope,
  onNavigate,
}: {
  scope: "growmerce" | "growsearch";
  onNavigate: () => void;
}) {
  return scope === "growsearch" ? (
    <GrowsearchPanel onNavigate={onNavigate} />
  ) : (
    <GrowmercePanel onNavigate={onNavigate} />
  );
}
