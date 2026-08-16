import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { label: "Products", href: "#products" },
  { label: "Prices", href: "#pricing" },
  { label: "Service", href: "#service" },
  { label: "About us", href: "#about" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/85 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-md">
      {/* Full-bleed: logo hugs the top-left corner, CTAs the top-right. */}
      <div className="relative flex h-[87px] w-full items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Growmerce home" className="shrink-0">
          <Image
            src="/brand/logo.svg"
            alt="Growmerce"
            width={305}
            height={66}
            priority
            className="h-11 w-auto"
          />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 font-poppins text-lg font-medium lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link href="#demo" className="pill-cta-white">
            Get a demo
          </Link>
          <Link href="#trial" className="pill-cta-outline hidden sm:inline-flex">
            Try it free
          </Link>
        </div>
      </div>
    </header>
  );
}
