import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import styles from "./ledger.module.css";

// Fraunces is the report's display serif — set boldly at large sizes, and in
// italic for pull-quotes and marginal notes. Manrope (loaded globally as
// font-sans) carries all running body copy and UI chrome.
const fraunces = Fraunces({
  variable: "--font-v1-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Growmerce — The Ledger",
  description:
    "Growmerce builds practical AI tools for the people actually running ecommerce stores. Read the thesis, meet Growsearch, and see the doctrine.",
};

export default function LedgerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${fraunces.variable} ${styles.page}`}>{children}</div>
  );
}
