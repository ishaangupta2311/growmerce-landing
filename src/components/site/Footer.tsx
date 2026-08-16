import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";

const COLUMNS = [
  {
    heading: "Product",
    links: ["Smart Search", "All products"],
  },
  {
    heading: "Explore more",
    links: ["Pricing", "Coming soon"],
  },
  {
    heading: "Support",
    links: ["Help center", "Getting started", "Customer Success"],
  },
];

const SOCIALS = [
  { name: "LinkedIn", icon: "/img/icon-linkedin.svg", href: "#" },
  { name: "Instagram", icon: "/img/icon-instagram.svg", href: "#" },
  { name: "X", icon: "/img/icon-x.svg", href: "#" },
];

function CtaBox({ label }: { label: string }) {
  return (
    <div className="relative h-[240px] rounded-[52px] border border-brand-bright sm:h-[393px]">
      <Link
        href="#demo"
        className="absolute -right-6 bottom-10 rounded-full bg-brand-bright px-8 py-2.5 text-2xl font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 lg:-right-24"
      >
        {label}
      </Link>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="px-3 pb-6">
      <div className="mx-auto max-w-[1459px] rounded-[56px] bg-white px-8 pt-20 pb-10 shadow-glow-lg sm:px-14 lg:px-24">
        <div id="demo" className="grid gap-16 pr-6 sm:grid-cols-2 lg:gap-44 lg:pr-24">
          <Reveal>
            <CtaBox label="Get a Demo" />
          </Reveal>
          <Reveal delay={150}>
            <CtaBox label="Free trial" />
          </Reveal>
        </div>

        <hr className="mt-20 border-black/15" />

        <div className="mt-10 flex flex-col justify-between gap-12 lg:flex-row">
          <div>
            <h3 className="text-2xl font-bold">Company</h3>
            <ul className="mt-4 space-y-3 text-lg">
              {["About", "Newsroom", "Contact us"].map((label) => (
                <li key={label}>
                  <Link href="#" className="transition-colors hover:text-brand">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-12 sm:grid-cols-3 lg:gap-16">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <h3 className="text-2xl font-bold">{col.heading}</h3>
                <ul className="mt-4 space-y-3 text-lg">
                  {col.links.map((label) => (
                    <li key={label}>
                      <Link
                        href="#"
                        className="transition-colors hover:text-brand"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr className="mt-16 border-black/15" />

        <div className="mt-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-8">
            {SOCIALS.map((social) => (
              <Link key={social.name} href={social.href} aria-label={social.name}>
                <Image
                  src={social.icon}
                  alt=""
                  width={31}
                  height={30}
                  className="transition-opacity hover:opacity-70"
                />
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-8 text-lg">
            <span>©2026 Growmerce</span>
            <Link href="#" className="transition-colors hover:text-brand">
              Terms &amp; Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
