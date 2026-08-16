import Link from "next/link";
import styles from "../ledger.module.css";
import Reveal from "@/components/site/Reveal";

const ENTRIES = [
  { no: "01", label: "The thesis", href: "#thesis" },
  { no: "02", label: "Exhibit A — Growsearch", href: "#products" },
  { no: "03", label: "Doctrine", href: "#principles" },
  { no: "04", label: "Proof, cited", href: "#proof" },
];

/** The report's contents page — a dot-leader index into the four sections. */
export default function Toc() {
  return (
    <Reveal className="border-b border-[var(--ink-15)] bg-[var(--paper-deep)]/60">
      <div className="mx-auto max-w-[1180px] px-6 py-6 sm:px-10">
        <p className="mb-4 text-[11px] font-semibold tracking-[0.22em] text-[var(--ink-40)] uppercase">
          In this report
        </p>
        <ol className="grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRIES.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className="flex items-baseline text-[15px] text-[var(--ink-85)] transition-colors hover:text-brand"
              >
                <span className={`${styles.serif} mr-2 text-[var(--ink-40)] italic`}>{entry.no}</span>
                <span>{entry.label}</span>
                <span className={styles.tocLeader} aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
