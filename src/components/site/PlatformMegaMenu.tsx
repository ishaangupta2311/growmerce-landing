import Image from "next/image";
import Link from "next/link";
import { PLATFORMS } from "./PlatformStrip";

const PRIMARY_LINKS = [
  {
    label: "What is Growmerce?",
    note: "The complete platform overview",
    href: "/about",
    icon: "question",
  },
  {
    label: "Solutions",
    note: "AI products we build for you",
    href: "/solutions",
    icon: "check",
  },
  {
    label: "Latest Product Update",
    note: "New releases",
    href: "/about#updates-title",
    icon: "new",
  },
] as const;

const WORKFLOWS = [
  { name: "Search", src: "/img/icon-search-circle.svg", size: 42 },
  { name: "Growth", src: "/img/icon-growth.svg", size: 40 },
  { name: "Automation", src: "/img/icon-workflow.svg", size: 36 },
  { name: "Revenue", src: "/img/icon-wallet.svg", size: 36 },
] as const;

function MenuIcon({ type }: { type: (typeof PRIMARY_LINKS)[number]["icon"] }) {
  if (type === "question") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden className="size-7">
        <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.4" />
        <path d="M12.8 12.2a3.5 3.5 0 1 1 5.7 2.7c-1.4 1.1-2.5 1.7-2.5 3.6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="16" cy="23.1" r="1.35" fill="currentColor" />
      </svg>
    );
  }

  if (type === "check") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden className="size-7">
        <path d="m5 17 4.2 4.5L18 9.8M13.6 19.2l3.8 4.1L27 10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <span aria-hidden className="grid h-6 min-w-9 place-items-center rounded-[3px] border-2 border-current px-1 text-[9px] leading-none font-extrabold tracking-[-0.03em]">
      NEW
    </span>
  );
}

function AuditMark() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className="size-14 shrink-0 xl:size-16">
      <circle cx="32" cy="32" r="29.5" stroke="currentColor" strokeWidth="2.5" />
      <path d="m33 13 5.1 10.4L50 25.1l-8.6 8.3 2 11.7L33 39.6 22.5 45l2-11.6-8.5-8.3 11.8-1.7L33 13Z" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="m18 47 2.2-4.7M47 49l-3.3-5.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function PlatformMegaMenu({
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: {
  onNavigate: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div
      id="platform-mega-menu"
      role="region"
      aria-label="Platform menu"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="mega-menu-enter fixed top-[92px] left-1/2 z-60 w-[calc(100vw-40px)] max-w-[1720px] overflow-hidden rounded-b-[38px] border-x border-b border-brand/15 bg-white font-bricolage shadow-[0_34px_90px_-34px_rgba(73,28,8,0.38)]"
    >
      <div className="flex min-h-[112px] items-center gap-5 bg-brand px-7 py-5 text-white xl:px-9">
        <AuditMark />
        <div className="min-w-0 flex-1">
          <p className="text-[clamp(1.55rem,2.3vw,2.45rem)] leading-[1.02] font-bold tracking-[-0.025em]">
            See your store&rsquo;s gaps in 60 seconds
          </p>
          <p className="mt-1 text-[clamp(1rem,1.55vw,1.6rem)] leading-snug font-normal text-white/92">
            Drop your URL, get the three workflows costing you the most hours
          </p>
        </div>
        <Link
          href="#demo"
          onClick={onNavigate}
          className="shrink-0 rounded-full bg-white px-7 py-3 text-[clamp(1rem,1.45vw,1.4rem)] leading-none font-medium text-brand shadow-[0_6px_0_rgba(112,37,8,0.28)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_0_rgba(112,37,8,0.24)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Okay, tell me
        </Link>
      </div>

      <div className="grid min-h-[356px] grid-cols-[minmax(220px,0.86fr)_minmax(350px,1.45fr)_minmax(260px,1fr)] gap-7 px-7 py-7 xl:grid-cols-[minmax(300px,1.05fr)_minmax(430px,1.25fr)_minmax(330px,1fr)] xl:gap-10 xl:px-10 xl:py-9">
        <div className="flex flex-col justify-center border-r border-line pr-6 xl:pr-9">
          {PRIMARY_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className="group flex items-start gap-4 rounded-xl px-2 py-3 text-charcoal transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span className="mt-0.5 shrink-0 text-muted transition-colors group-hover:text-brand">
                <MenuIcon type={item.icon} />
              </span>
              <span>
                <span className="block text-[clamp(1.05rem,1.45vw,1.45rem)] leading-tight font-semibold">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[clamp(0.82rem,1vw,1rem)] leading-snug font-normal text-muted">
                  {item.note}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="flex flex-col justify-center">
          <Link
            href="/growsearch/features"
            onClick={onNavigate}
            className="w-fit text-[clamp(1.25rem,1.7vw,1.65rem)] leading-tight font-semibold underline decoration-brand decoration-2 underline-offset-4 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            The workflows we build
          </Link>
          <div className="mt-5 grid grid-cols-4 gap-3 xl:gap-5">
            {WORKFLOWS.map((workflow) => (
              <div key={workflow.name} className="flex min-w-0 flex-col items-center gap-2">
                <span className="grid size-16 place-items-center rounded-full bg-[#f1f1f1] xl:size-[74px]">
                  <Image src={workflow.src} alt="" width={workflow.size} height={workflow.size} className="size-auto max-h-11 max-w-11 object-contain" />
                </span>
                <span className="text-[11px] font-medium text-muted xl:text-[13px]">{workflow.name}</span>
              </div>
            ))}
          </div>

          <p className="mt-7 text-[clamp(1.25rem,1.7vw,1.65rem)] leading-tight font-semibold">
            Available on
          </p>
          <div className="mt-4 grid grid-cols-4 gap-3 xl:gap-5">
            {PLATFORMS.map((platform) => (
              <span key={platform.name} title={platform.name} className="grid size-16 place-items-center rounded-full bg-[#f1f1f1] p-3 xl:size-[74px]">
                <Image
                  src={platform.src}
                  alt={platform.name}
                  width={platform.w}
                  height={platform.h}
                  sizes="74px"
                  className="h-auto max-h-9 w-full object-contain"
                />
              </span>
            ))}
          </div>
        </div>

        <Link
          href="/growsearch"
          onClick={onNavigate}
          className="group flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-brand bg-[#fffaf7] p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-22px_rgba(255,90,31,0.7)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
        >
          <span className="text-[12px] font-medium tracking-[0.04em] text-muted uppercase">Live now</span>
          <span className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[13px] bg-white">
            <Image
              src="/img/smart-search-mock.png"
              alt="Growsearch storefront results and search analytics"
              fill
              sizes="(min-width: 1280px) 360px, 290px"
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.025]"
            />
          </span>
          <span className="mt-3 flex items-center justify-between gap-3">
            <span>
              <span className="block text-[clamp(1rem,1.2vw,1.2rem)] font-semibold text-charcoal">Growsearch</span>
              <span className="block text-[12px] leading-snug font-normal text-muted xl:text-[13px]">Storefront search that never dead-ends</span>
            </span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5 shrink-0 text-brand transition-transform duration-200 group-hover:translate-x-1">
              <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
