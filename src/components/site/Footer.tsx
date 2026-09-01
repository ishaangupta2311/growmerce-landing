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
        {/* Two columns from the smallest phone up. Four link lists stacked in
            one column made the footer taller than the page section above it,
            and none of these lists is long enough to need the full width. */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] lg:gap-8">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[clamp(1.125rem,1.6vw,1.5rem)] font-bold">
                {col.heading}
              </h3>
              {/* The padding is the tap target: a 17px line box is 21px tall,
                  under the 24px minimum, and on a phone these sit in a single
                  column where a mis-tap costs a page load. The list spacing
                  comes off to match, so the rhythm barely moves. */}
              <ul className="mt-3 space-y-1">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-block py-1.5 text-[17px] text-body-mute transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-5 border-t border-line pt-6 sm:flex-row sm:items-center lg:mt-14 lg:pt-7">
          {/* The icons are 28px; the 44px box around each is the tap target.
              -ml-2 pulls the first one's padding back off the margin so the
              row still starts on the column's edge, and gap-3.5 restores the
              28px the old gap-7 put between the marks themselves. */}
          <div className="-ml-2 flex items-center gap-3.5">
            {SOCIALS.map((s) => (
              <Link
                key={s.name}
                href="#"
                aria-label={s.name}
                className="grid size-11 place-items-center"
              >
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
          {/* The notice and the legal links are separate lines on a phone —
              wrapped together they broke as "copyright + terms" then a lonely
              "privacy" underneath. */}
          <div className="flex flex-col gap-1.5 text-[16px] sm:flex-row sm:items-center sm:gap-x-8">
            <span className="font-semibold">&copy;2026 Growmerce</span>
            <span className="flex flex-wrap items-center gap-x-6">
              <Link
                href="/terms"
                className="inline-block py-1.5 text-body-mute transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Terms &amp; Conditions
              </Link>
              <Link
                href="/privacy"
                className="inline-block py-1.5 text-body-mute transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Privacy Policy
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
