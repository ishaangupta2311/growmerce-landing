import Image from "next/image";
import Link from "next/link";
import styles from "../bazaar.module.css";
import { Barcode, focusRing, Sparkle, Tape } from "./bits";

const COLUMNS = [
  {
    heading: "On the shelf",
    links: [
      { label: "Growsearch", href: "#shelf" },
      { label: "Unit 02 — still packing", href: "#shelf" },
      { label: "Unit 03 — still packing", href: "#shelf" },
    ],
  },
  {
    heading: "The company",
    links: [
      { label: "What's in the box", href: "#why" },
      { label: "House rules", href: "#house-rules" },
      { label: "Meet the packer", href: "#founder" },
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
      <div
        aria-hidden
        className={`${styles.hazard} h-6 border-y-[3px] border-[#2b1c14]`}
      />

      <div className={`${styles.kraft} px-5 pt-16 pb-10 sm:px-8`}>
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1.9fr] lg:gap-14">
            {/* The address label on the outside of the carton. */}
            <div className="relative">
              <Tape className="absolute -top-4 left-10 z-[3] h-8 w-24 -rotate-[6deg]" />
              <div
                className={`${styles.grain} -rotate-[1deg] border-[3px] border-[#2b1c14] bg-[#fffaf5] p-5 shadow-[6px_8px_0_rgba(96,44,14,0.28)] sm:p-6`}
              >
                <div className="relative z-[2]">
                  <p
                    className={`${styles.mono} text-[10.5px] font-bold tracking-[0.28em] text-[#5a4034] uppercase`}
                  >
                    From
                  </p>
                  <Image
                    src="/brand/logo.svg"
                    alt="Growmerce"
                    width={305}
                    height={66}
                    className="mt-2 h-9 w-auto"
                  />
                  <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-[#5a4034]">
                    An ecommerce AI studio: we own, operate and build practical
                    tools for the people actually running stores. Packed in
                    Delhi, useful everywhere.
                  </p>

                  <ul className="mt-5 flex items-center gap-2.5">
                    {SOCIALS.map((s) => (
                      <li key={s.label}>
                        <Link
                          href={s.href}
                          aria-label={s.label}
                          className={`${styles.springy} ${styles.springySm} ${focusRing} grid size-10 place-items-center rounded-[10px] border-[3px] border-[#2b1c14] bg-[#ffd66e] hover:bg-[#fff6ee]`}
                        >
                          <Image
                            src={s.src}
                            alt=""
                            width={20}
                            height={20}
                            className="size-[17px] opacity-85"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-9 sm:grid-cols-3">
              {COLUMNS.map((col) => (
                <div key={col.heading}>
                  <h3
                    className={`${styles.mono} inline-block border-2 border-[#2b1c14] bg-[#2b1c14] px-2.5 py-1 text-[10.5px] font-bold tracking-[0.2em] text-[#ffe8df] uppercase`}
                  >
                    {col.heading}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className={`${focusRing} inline-block rounded-md text-[15px] font-semibold text-[#33200f] transition-colors duration-200 hover:text-[#6b2400]`}
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
            className="mt-14 h-[3px] w-full border-t-[3px] border-dashed border-[#2b1c14]/45"
          />

          <div className="mt-6 flex flex-col-reverse items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="text-[13.5px] text-[#4a2f1e]">
              <p>© {new Date().getFullYear()} Growmerce. All rights reserved.</p>
              <p
                className={`${styles.hand} mt-2 flex items-center gap-2 text-[21px] text-[#6b2400]`}
              >
                <Sparkle className={`${styles.twinkle} size-3`} />
                packed with care, mostly at night
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end">
              <Barcode
                seed="growmerce-footer-05"
                bars={38}
                className="h-10 w-[190px]"
              />
              <p
                className={`${styles.mono} mt-1.5 text-[10px] font-bold tracking-[0.26em] text-[#4a2f1e]`}
              >
                GRW·05·DELHI·GLOBAL
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
