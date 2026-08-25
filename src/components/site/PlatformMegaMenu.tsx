import Image from "next/image";
import Link from "next/link";
import { PLATFORMS } from "./PlatformStrip";
import { GROWSEARCH_FEATURES, GROWSEARCH_HOME } from "@/lib/site-urls";

type MenuIconType = "question" | "check" | "new" | "price";

const GROWMERCE_PRIMARY_LINKS = [
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

const GROWSEARCH_PRIMARY_LINKS = [
  {
    label: "What is Growsearch?",
    note: "Storefront search that never dead-ends",
    href: GROWSEARCH_HOME,
    icon: "question",
  },
  {
    label: "Growsearch Features",
    note: "Everything Growsearch does",
    href: GROWSEARCH_FEATURES,
    icon: "check",
  },
  {
    label: "Pricing & Plans",
    note: "Choose the right search volume",
    href: "/pricing",
    icon: "price",
  },
] as const;

const GROWMERCE_WORKFLOWS = [
  { name: "Search", src: "/img/icon-search-circle.svg", size: 42 },
  { name: "Growth", src: "/img/icon-growth.svg", size: 40 },
  { name: "Automation", src: "/img/icon-workflow.svg", size: 36 },
  { name: "Revenue", src: "/img/icon-wallet.svg", size: 36 },
] as const;

const GROWSEARCH_WORKFLOWS = [
  { name: "Intent search", src: "/img/icon-search-circle.svg", size: 42 },
  { name: "Recovery", src: "/img/icon-workflow.svg", size: 36 },
  { name: "Conversation", src: "/img/icon-sparkle.svg", size: 34 },
  { name: "Analytics", src: "/img/icon-growth.svg", size: 40 },
] as const;

function MenuIcon({ type }: { type: MenuIconType }) {
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

  if (type === "price") {
    return (
      <Image
        src="/img/icon-wallet.svg"
        alt=""
        width={28}
        height={28}
        className="size-7 object-contain"
      />
    );
  }

  return (
    <span aria-hidden className="grid h-6 min-w-9 place-items-center rounded-[3px] border-2 border-current px-1 text-[9px] leading-none font-extrabold tracking-[-0.03em]">
      NEW
    </span>
  );
}

export default function PlatformMegaMenuContent({
  scope,
  onNavigate,
}: {
  scope: "growmerce" | "growsearch";
  onNavigate: () => void;
}) {
  const isGrowsearch = scope === "growsearch";
  const primaryLinks = isGrowsearch
    ? GROWSEARCH_PRIMARY_LINKS
    : GROWMERCE_PRIMARY_LINKS;
  const workflows = isGrowsearch
    ? GROWSEARCH_WORKFLOWS
    : GROWMERCE_WORKFLOWS;

  return (
    <div className="grid h-[282px] grid-cols-[minmax(220px,0.95fr)_minmax(340px,1.35fr)_minmax(250px,0.9fr)] gap-6 px-6 py-5">
      <div className="flex flex-col justify-start border-r border-line pr-6">
          {primaryLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className="group flex items-start gap-3 rounded-[8px] px-2 py-2 text-charcoal transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span className="mt-0.5 shrink-0 text-muted transition-colors group-hover:text-brand">
                <MenuIcon type={item.icon} />
              </span>
              <span>
                <span className="block text-[clamp(1rem,1.2vw,1.18rem)] leading-tight font-semibold">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[clamp(0.78rem,0.9vw,0.88rem)] leading-snug font-normal text-muted">
                  {item.note}
                </span>
              </span>
            </Link>
          ))}
      </div>

      <div className="flex flex-col justify-start">
          <Link
            href={GROWSEARCH_FEATURES}
            onClick={onNavigate}
            className="w-fit text-[clamp(1.1rem,1.4vw,1.3rem)] leading-tight font-semibold underline decoration-brand decoration-2 underline-offset-4 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {isGrowsearch ? "What Growsearch does" : "The workflows we build"}
          </Link>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {workflows.map((workflow) => (
              <div key={workflow.name} className="flex min-w-0 flex-col items-center gap-2">
                <span className="grid size-14 place-items-center rounded-full bg-white">
                  <Image src={workflow.src} alt="" width={workflow.size} height={workflow.size} className="size-auto max-h-11 max-w-11 object-contain" />
                </span>
                <span className="text-[11px] font-medium text-muted">{workflow.name}</span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-[clamp(1.1rem,1.4vw,1.3rem)] leading-tight font-semibold">
            Available on
          </p>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {PLATFORMS.map((platform) => (
              <span key={platform.name} title={platform.name} className="grid size-14 place-items-center rounded-full bg-white p-2.5">
                <Image
                  src={platform.src}
                  alt={platform.name}
                  width={platform.w}
                  height={platform.h}
                  sizes="56px"
                  className="h-auto max-h-9 w-full object-contain"
                />
              </span>
            ))}
          </div>
      </div>

      <Link
          href={GROWSEARCH_HOME}
          onClick={onNavigate}
          className="group flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-brand bg-white p-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-22px_rgba(255,90,31,0.7)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
        >
          <span className="text-[12px] font-medium tracking-[0.04em] text-muted uppercase">Live now</span>
          <span className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[13px] bg-cream">
            <Image
              src="/img/smart-search-mock.png"
              alt="Growsearch storefront results and search analytics"
              fill
              sizes="(min-width: 1280px) 360px, 290px"
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.025]"
            />
          </span>
          <span className="mt-2 flex items-center justify-between gap-3">
            <span>
              <span className="block text-[clamp(0.95rem,1.1vw,1.05rem)] font-semibold text-charcoal">Growsearch</span>
              <span className="block text-[11px] leading-snug font-normal text-muted">Storefront search that never dead-ends</span>
            </span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5 shrink-0 text-brand transition-transform duration-200 group-hover:translate-x-1">
              <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
      </Link>
    </div>
  );
}
