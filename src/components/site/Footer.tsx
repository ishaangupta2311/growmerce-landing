import Image from "next/image";
import Link from "next/link";
import { GROWSEARCH_FEATURES, GROWSEARCH_HOME } from "@/lib/site-urls";

const COLUMNS = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Newsroom", href: "#" },
      { label: "Contact us", href: "mailto:admin@growmerce.ai" },
    ],
  },
  {
    heading: "Product",
    links: [
      { label: "Growsearch", href: GROWSEARCH_HOME },
      { label: "All products", href: GROWSEARCH_FEATURES },
    ],
  },
  {
    heading: "Explore more",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Coming soon", href: "#" },
    ],
  },
  {
    heading: "Need help?",
    links: [
      { label: "Help center", href: "#" },
      { label: "Getting started", href: "#" },
      { label: "Customer Success", href: "#" },
    ],
  },
];

/* Intrinsic sizes, not the display size: these marks are not square, and
   declaring them as such makes the computed height contradict the attribute. */
const SOCIALS = [
  { name: "LinkedIn", icon: "/img/icon-linkedin.svg", w: 32, h: 30 },
  { name: "Instagram", icon: "/img/icon-instagram.svg", w: 34, h: 33 },
  { name: "X", icon: "/img/icon-x.svg", w: 32, h: 30 },
];

export default function Footer() {
  return (
    <footer className="mx-auto max-w-[1370px] px-6 pb-10 font-bricolage">
      <div className="border-t border-line pt-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] lg:gap-8">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[clamp(1.125rem,1.6vw,1.5rem)] font-bold">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[17px] text-body-mute transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-line pt-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-7">
            {SOCIALS.map((s) => (
              <Link key={s.name} href="#" aria-label={s.name}>
                <Image
                  src={s.icon}
                  alt=""
                  width={s.w}
                  height={s.h}
                  className="h-7 w-auto transition-opacity hover:opacity-65"
                />
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[16px]">
            <span className="font-semibold">@2026 Growmerce</span>
            <Link
              href="/terms"
              className="text-body-mute transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/privacy"
              className="text-body-mute transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
