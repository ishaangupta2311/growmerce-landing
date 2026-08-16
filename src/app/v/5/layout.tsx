import type { Metadata } from "next";
import { Anton, Bricolage_Grotesque, Caveat, Courier_Prime } from "next/font/google";
import styles from "./bazaar.module.css";

/* Four faces, four jobs — the way a real packaging system works.

   Bricolage carries every heading and label (continuity with variant 03).
   Anton is the loud poster face: it only ever appears set large, uppercase and
   rotated, the way display type is printed on a sticker sheet or a crate.
   Courier Prime is the packing-slip typewriter — receipts, stamps, barcodes,
   nutrition-panel fine print. Caveat is the founder's own hand, used only for
   things a person would have written on the box. Manrope (global `font-sans`)
   still carries all running body copy. */
const display = Bricolage_Grotesque({
  variable: "--font-v5-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const poster = Anton({
  variable: "--font-v5-poster",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const mono = Courier_Prime({
  variable: "--font-v5-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const hand = Caveat({
  variable: "--font-v5-hand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Growmerce — practical AI for people who sell things",
  description:
    "Growmerce is an ecommerce AI studio: we own, operate and build practical AI tools for the people actually running stores. First product on the shelf: Growsearch, storefront search that never dead-ends.",
};

export default function BazaarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${display.variable} ${poster.variable} ${mono.variable} ${hand.variable} ${styles.shell}`}
    >
      {children}
    </div>
  );
}
