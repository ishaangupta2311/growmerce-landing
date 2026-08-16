import Image from "next/image";
import Link from "next/link";
import styles from "../ledger.module.css";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";

const NAV_LINKS = [
  { label: "Thesis", href: "#thesis" },
  { label: "Products", href: "#products" },
  { label: "Principles", href: "#principles" },
  { label: "Proof", href: "#proof" },
];

const SOCIALS = [
  { name: "LinkedIn", icon: "/img/icon-linkedin.svg", href: "#" },
  { name: "Instagram", icon: "/img/icon-instagram.svg", href: "#" },
  { name: "X", icon: "/img/icon-x.svg", href: "#" },
];

export default function Footer() {
  return (
    <>
      <section id="cta" className="scroll-mt-20 bg-[var(--ink)] text-[var(--paper)]">
        <div className="mx-auto max-w-[1180px] px-6 py-24 sm:px-10 sm:py-32">
          <Reveal>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--paper)]/50 uppercase">
              Closing entry
            </p>
            <h2 className={`${styles.serif} mt-6 max-w-[20ch] text-[2.6rem] leading-[1.06] font-semibold sm:text-[3.6rem]`}>
              Get early access to Growmerce.
            </h2>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-[var(--paper)]/70">
              Talk to the founder, see Growsearch on your own storefront, and
              get on the list for what ships next.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="#"
                className="inline-flex items-center gap-3 bg-brand px-7 py-3.5 text-[15px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Get early access
                <Arrow className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="inline-flex items-center gap-2 border-b border-[var(--paper)]/60 pb-0.5 text-[15px] font-semibold text-[var(--paper)] transition-colors hover:border-brand hover:text-brand"
              >
                View demo
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="bg-[var(--paper)]">
        <div className="mx-auto max-w-[1180px] px-6 py-10 sm:px-10">
          <div className="flex flex-col gap-8 border-t border-[var(--ink-15)] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <Image src="/brand/logo.svg" alt="Growmerce" width={118} height={26} />

            <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-semibold tracking-[0.1em] text-[var(--ink-55)] uppercase transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              {SOCIALS.map((s) => (
                <Link
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="opacity-60 transition-opacity hover:opacity-100"
                >
                  <Image src={s.icon} alt="" width={16} height={16} aria-hidden />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 text-[13px] text-[var(--ink-40)] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Growmerce. Practical AI for the people running the store.</p>
            <p>Delhi, India</p>
          </div>
        </div>
      </footer>
    </>
  );
}
