/**
 * A titled block on the dashboard, and the scroll container its table needs.
 *
 * The `overflow-x-auto` is load-bearing on a phone. These tables have four or
 * five columns of store names and money and cannot usefully collapse to one column,
 * so they scroll sideways — and a table that scrolls has to be reachable by
 * keyboard, hence `tabIndex={0}` and the group label. Without those, a scroll
 * container is a region a keyboard user cannot move through at all.
 */
export default function Panel({
  title,
  action,
  children,
  scroll = false,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <section className="rounded-[16px] border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="font-poppins text-[17px] font-bold text-charcoal">{title}</h2>
        {action}
      </header>
      {scroll ? (
        <div
          role="group"
          aria-label={`${title}, scrollable`}
          tabIndex={0}
          className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        >
          {children}
        </div>
      ) : (
        <div className="p-5">{children}</div>
      )}
    </section>
  );
}
