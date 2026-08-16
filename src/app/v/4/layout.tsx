import type { Metadata } from "next";
import { Bebas_Neue, Bricolage_Grotesque, Caveat } from "next/font/google";
import styles from "./nightmarket.module.css";

/* Bricolage carries the headings, exactly as it does on the daylight street —
   the two variants are the same shop at different hours. Caveat is the
   shopkeeper's handwriting. Bebas Neue is new here and earns its keep by only
   ever appearing on things that are literally signage: the neon, the cinema
   letterboard, the unit numbers. Manrope (global `font-sans`) still carries
   every piece of body copy. */
const display = Bricolage_Grotesque({
  variable: "--font-v4-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const hand = Caveat({
  variable: "--font-v4-hand",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const signwriter = Bebas_Neue({
  variable: "--font-v4-sign",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Growmerce — the high street of AI tools for ecommerce, after dark",
  description:
    "Growmerce builds practical AI tools for the people actually running stores. First shop open and lit: Growsearch, storefront search that never dead-ends.",
};

export default function NightMarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${display.variable} ${hand.variable} ${signwriter.variable} ${styles.shell}`}
    >
      {children}
    </div>
  );
}
