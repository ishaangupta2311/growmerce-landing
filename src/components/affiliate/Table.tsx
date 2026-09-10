/**
 * The dashboard's tables.
 *
 * A real `<table>`, not a grid of divs. Every one of these is a list of records
 * with shared columns — that is what a table is for, and it is what gives a
 * screen reader the ability to announce "Shop, acme.myshopify.com" instead of
 * reading a wall of unlabelled cells. The `<caption>` names the table for the
 * same reason and is visually hidden because the panel header above it already
 * says the same thing to anyone who can see it.
 *
 * `Num` right-aligns and uses tabular figures. Money in a column that is not
 * right-aligned cannot be compared down the column, which is the only reason to
 * put it in a column.
 */

export function Table({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-[640px] border-collapse text-left">
      <caption className="sr-only">{caption}</caption>
      {children}
    </table>
  );
}

export function Head({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line">{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  numeric = false,
}: {
  children: React.ReactNode;
  numeric?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`px-5 py-3 font-poppins text-[12.5px] font-bold tracking-[0.04em] text-body-mute uppercase ${
        numeric ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function Row({ children }: { children: React.ReactNode }) {
  return <tr className="transition-colors hover:bg-cream/60">{children}</tr>;
}

export function Td({
  children,
  numeric = false,
}: {
  children: React.ReactNode;
  numeric?: boolean;
}) {
  return (
    <td
      className={`px-5 py-4 align-middle text-[15px] text-charcoal ${
        numeric ? "text-right tabular-nums" : ""
      }`}
    >
      {children}
    </td>
  );
}

/**
 * The first cell of a row: the thing the row is *about*.
 *
 * `scope="row"` turns it into the row's header, which is what lets a screen
 * reader prefix every other cell with the store name instead of reading five
 * numbers with nothing attached to them.
 */
export function RowHeader({ children }: { children: React.ReactNode }) {
  return (
    <th scope="row" className="px-5 py-4 text-left align-middle font-normal">
      {children}
    </th>
  );
}
