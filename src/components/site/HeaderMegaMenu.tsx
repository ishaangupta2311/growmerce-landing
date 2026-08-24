import Image from "next/image";
import Link from "next/link";
import PlatformMegaMenuContent from "./PlatformMegaMenu";

export type HeaderMegaMenuVariant = "platform" | "resources" | "why-us";

const RESOURCE_GROUPS = [
  {
    title: "Learn & Discover",
    links: [
      { label: "Getting Started", href: "/about" },
      { label: "Blogs", href: "/about#updates-title" },
      { label: "Videos", href: "/about#updates-title" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { label: "Getting Started", href: "/growsearch" },
      { label: "Blogs", href: "/solutions" },
      { label: "Videos", href: "/growsearch/features" },
      { label: "Community", href: "/about" },
    ],
  },
] as const;

const WHY_US_GROUPS = [
  {
    title: "Compare",
    links: [
      { label: "Growmerce Vs Competition", href: "/solutions" },
      { label: "Is Growmerce a fit for me?", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Partnership program", href: "/about" },
    ],
  },
  {
    title: "Proof",
    links: [
      { label: "Analytics", href: "/growsearch" },
      { label: "Blogs", href: "/about#updates-title" },
      { label: "Videos", href: "/about#updates-title" },
    ],
  },
] as const;

function LinkGroup({
  group,
  onNavigate,
}: {
  group: (typeof RESOURCE_GROUPS)[number] | (typeof WHY_US_GROUPS)[number];
  onNavigate: () => void;
}) {
  return (
    <section>
      <h2 className="border-b border-line pb-2 text-[clamp(1.05rem,1.35vw,1.3rem)] leading-tight font-semibold text-charcoal">
        {group.title}
      </h2>
      <div className="mt-3 flex flex-col items-start gap-1">
        {group.links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={onNavigate}
            className="rounded-[6px] py-0.5 text-[clamp(0.95rem,1.15vw,1.08rem)] leading-snug font-medium text-charcoal/70 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function HeaderMegaMenu({
  variant,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: {
  variant: HeaderMegaMenuVariant;
  onNavigate: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const isPlatform = variant === "platform";
  const isResources = variant === "resources";
  const groups = isResources ? RESOURCE_GROUPS : WHY_US_GROUPS;
  const label = isPlatform ? "Platform" : isResources ? "Resources" : "Why us";

  return (
    <div
      id="header-mega-menu"
      role="region"
      aria-label={`${label} menu`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="mega-menu-enter fixed top-[84px] left-1/2 z-60 w-[calc(100vw-64px)] max-w-[1160px] overflow-hidden rounded-b-[38px] border-x border-b border-brand/15 bg-white font-bricolage shadow-[0_28px_64px_-34px_rgba(73,28,8,0.34)]"
    >
      {isPlatform ? (
        <PlatformMegaMenuContent onNavigate={onNavigate} />
      ) : isResources ? (
        <div className="grid h-[282px] grid-cols-[1fr_1fr_0.95fr] gap-12 px-16 py-7">
          {groups.map((group) => (
            <LinkGroup key={group.title} group={group} onNavigate={onNavigate} />
          ))}
          <Link
            href="/about#updates-title"
            onClick={onNavigate}
            className="group flex min-h-[210px] flex-col overflow-hidden rounded-[22px] border border-brand bg-[#fffaf7] p-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-22px_rgba(255,90,31,0.7)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
          >
            <span className="text-[11px] font-medium tracking-[0.04em] text-muted uppercase">Read it</span>
            <span className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[13px] bg-white">
              <Image
                src="/img/pages/hero-shopping-desk.png"
                alt="Growmerce ecommerce article"
                fill
                sizes="280px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
              />
            </span>
          </Link>
        </div>
      ) : (
        <div className="grid h-[282px] grid-cols-3 gap-16 px-20 py-9">
          {groups.map((group) => (
            <LinkGroup key={group.title} group={group} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
