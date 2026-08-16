import Image from "next/image";
import Link from "next/link";
import styles from "../shopfront.module.css";
import { AwningBand, focusRing, Sparkle } from "./bits";

const COLUMNS = [
  {
    heading: "The shops",
    links: [
      { label: "Growsearch", href: "#high-street" },
      { label: "Unit 02 — opening soon", href: "#high-street" },
      { label: "Unit 03 — opening soon", href: "#high-street" },
    ],
  },
  {
    heading: "The company",
    links: [
      { label: "Why we exist", href: "#why" },
      { label: "House rules", href: "#house-rules" },
      { label: "Meet the shopkeeper", href: "#shopkeeper" },
    ],
  },
  {
    heading: "Come in",
    links: [
      { label: "Get early access", href: "#early-access" },
      { label: "Book a founder demo", href: "#early-access" },
    ],
  },
];

const SOCIALS = [
  { label: "Growmerce on X", src: "/img/icon-x.svg", href: "#" },
  { label: "Growmerce on LinkedIn", src: "/img/icon-linkedin.svg", href: "#" },
  { label: "Growmerce on Instagram", src: "/img/icon-instagram.svg", href: "#" },
];

export default function Footer() {
  return (
    <footer className="relative">
      <AwningBand deep className="h-8" />

      <div className="bg-[#ffe8df] px-5 pt-16 pb-10 sm:px-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
            <div>
              <Image
                src="/brand/logo.svg"
                alt="Growmerce"
                width={305}
                height={66}
                className="h-10 w-auto"
              />
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#5a4034]">
                An ecommerce AI studio: we own, operate and build practical
                tools for the people actually running stores. Delhi-made,
                globally useful.
              </p>

              <ul className="mt-6 flex items-center gap-3">
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    <Link
                      href={s.href}
                      aria-label={s.label}
                      className={`${styles.springy} ${focusRing} grid size-11 place-items-center rounded-full bg-[#fffaf6] ring-1 ring-[#2b1c14]/10 hover:bg-white`}
                    >
                      <Image
                        src={s.src}
                        alt=""
                        width={20}
                        height={20}
                        className="size-[18px] opacity-80"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-10 sm:grid-cols-3">
              {COLUMNS.map((col) => (
                <div key={col.heading}>
                  <h3
                    className={`${styles.display} text-[13px] font-extrabold tracking-[0.14em] text-[#8a6b58] uppercase`}
                  >
                    {col.heading}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className={`${focusRing} inline-block rounded-md text-[15px] font-medium text-[#3d2a20] transition-colors duration-200 hover:text-[#eb5213]`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div
            aria-hidden
            className="mt-14 h-px w-full bg-[#2b1c14]/10"
          />

          <div className="mt-6 flex flex-col-reverse items-start justify-between gap-4 text-[13.5px] text-[#7a5a48] sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Growmerce. All rights reserved.</p>
            <p className={`${styles.hand} flex items-center gap-2 text-[20px] text-[#eb5213]`}>
              <Sparkle className={`${styles.twinkle} size-3`} />
              open most hours, building the rest
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
