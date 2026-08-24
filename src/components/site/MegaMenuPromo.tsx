import Link from "next/link";

function AuditMark() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className="size-12 shrink-0">
      <circle cx="32" cy="32" r="29.5" stroke="currentColor" strokeWidth="2.5" />
      <path d="m33 13 5.1 10.4L50 25.1l-8.6 8.3 2 11.7L33 39.6 22.5 45l2-11.6-8.5-8.3 11.8-1.7L33 13Z" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="m18 47 2.2-4.7M47 49l-3.3-5.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function MegaMenuPromo({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex min-h-[88px] items-center gap-4 bg-brand px-6 py-3.5 text-white">
      <AuditMark />
      <div className="min-w-0 flex-1">
        <p className="text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.05] font-bold tracking-[-0.025em]">
          See your store&rsquo;s gaps in 60 seconds
        </p>
        <p className="mt-1 text-[clamp(0.9rem,1.3vw,1.15rem)] leading-snug font-normal text-white/92">
          Drop your URL, get the three workflows costing you the most hours
        </p>
      </div>
      <Link
        href="#demo"
        onClick={onNavigate}
        className="shrink-0 rounded-full bg-white px-6 py-2.5 text-[clamp(0.95rem,1.2vw,1.1rem)] leading-none font-medium text-brand shadow-[0_4px_0_rgba(112,37,8,0.28)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(112,37,8,0.24)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Okay, tell me
      </Link>
    </div>
  );
}
