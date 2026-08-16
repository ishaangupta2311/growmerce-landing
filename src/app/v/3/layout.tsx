import type { Metadata } from "next";
import { Bricolage_Grotesque, Caveat } from "next/font/google";
import styles from "./shopfront.module.css";

/* Bricolage carries every heading and sign in this variant — it has the chunky,
   slightly quirky retail warmth the direction needs. Caveat is used sparingly,
   only for things a shopkeeper would have written by hand. Manrope (global
   `font-sans`) still carries all body copy. */
const display = Bricolage_Grotesque({
  variable: "--font-v3-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const hand = Caveat({
  variable: "--font-v3-hand",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Growmerce — the high street of AI tools for ecommerce",
  description:
    "Growmerce builds practical AI tools for the people actually running stores. First shop open: Growsearch, storefront search that never dead-ends.",
};

export default function ShopfrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${display.variable} ${hand.variable} ${styles.shell}`}>
      {children}
    </div>
  );
}
