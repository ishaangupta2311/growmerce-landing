import Image from "next/image";
import Link from "next/link";
import styles from "../nightmarket.module.css";
import { focusRing, Lightbox, Sparkle } from "./bits";
import { StringLights } from "./scenery";

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
    <footer className="relative border-t border-[#ffc46b]/12 bg-[#120b06]">
      {/* The lights carry on past the end of the street. */}
      <StringLights
        className="absolute inset-x-[-2%] -top-6 z-10 w-[104%]"
        swags={5}
        height={72}
      />

      <div className="px-5 pt-24 pb-10 sm:px-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
            <div>
              <Lightbox />
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[#e3cab4]">
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
                      className={`${styles.springy} ${focusRing} grid size-11 place-items-center rounded-full bg-[#241710] ring-1 ring-[#ffc46b]/20 hover:bg-[#33231a] hover:ring-[#ffc46b]/50`}
                    >
                      <Image
                        src={s.src}
                        alt=""
                        width={20}
                        height={20}
                        className="size-[18px] opacity-85 invert"
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
                    className={`${styles.sign} text-[16px] leading-none tracking-[0.16em] text-[#ffc46b]`}
                  >
                    {col.heading}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className={`${focusRing} inline-block rounded-md text-[15px] font-medium text-[#e3cab4] transition-colors duration-200 hover:text-[#ff8a3c]`}
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

          <div aria-hidden className="mt-14 h-px w-full bg-[#ffc46b]/12" />

          <div className="mt-6 flex flex-col-reverse items-start justify-between gap-4 text-[13.5px] text-[#bda28c] sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Growmerce. All rights reserved.</p>
            <p
              className={`${styles.hand} flex items-center gap-2 text-[20px] text-[#ffc46b]`}
            >
              <Sparkle className={`${styles.twinkle} size-3`} />
              open late most nights, building the rest
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
