import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { label: "Thesis", href: "#thesis" },
  { label: "Products", href: "#products" },
  { label: "Principles", href: "#principles" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ink-15)] bg-[var(--paper)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 py-4 sm:px-10">
        <Link href="/v/1" className="flex items-center gap-2" aria-label="Growmerce home">
          <Image src="/brand/logo.svg" alt="Growmerce" width={132} height={29} priority />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative text-[13px] font-semibold tracking-[0.14em] text-[var(--ink-70)] uppercase transition-colors hover:text-[var(--ink)]"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand transition-[width] duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <Link
          href="#cta"
          className="inline-flex items-center gap-2 border border-[var(--ink)] px-5 py-2.5 text-[13px] font-semibold tracking-[0.08em] text-[var(--ink)] uppercase transition-colors duration-200 hover:bg-[var(--ink)] hover:text-[var(--paper)]"
        >
          Get early access
        </Link>
      </div>
    </header>
  );
}
