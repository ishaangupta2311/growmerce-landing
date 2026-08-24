import Image from "next/image";
import Link from "next/link";

const COLUMNS = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Newsroom", href: "#" },
      { label: "Contact us", href: "#" },
    ],
  },
  {
    heading: "Product",
    links: [
      { label: "Growsearch", href: "/growsearch" },
      { label: "All products", href: "/growsearch/features" },
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

const SOCIALS = [
  { name: "LinkedIn", icon: "/img/icon-linkedin.svg" },
  { name: "Instagram", icon: "/img/icon-instagram.svg" },
  { name: "X", icon: "/img/icon-x.svg" },
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
                  width={28}
                  height={28}
                  className="transition-opacity hover:opacity-65"
                />
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-8 text-[16px]">
            <span className="font-semibold">@2026 Growmerce</span>
            <Link
              href="#"
              className="text-body-mute transition-colors hover:text-brand"
            >
              Terms &amp; Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
