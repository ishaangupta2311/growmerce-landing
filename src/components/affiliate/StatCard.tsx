/**
 * One headline figure.
 *
 * The label sits above the number rather than below it. These four cards read
 * as a row of large orange numbers otherwise, and "which of these can I
 * withdraw" is the question a partner opens this page to answer — so the word
 * has to arrive first.
 *
 * `tabular-nums` because the four figures sit in a row and are compared against
 * each other at a glance; proportional digits make a `1` narrower than a `7`
 * and the columns stop lining up.
 */
export default function StatCard({
  label,
  value,
  note,
  emphasis = false,
}: {
  label: string;
  value: string;
  note?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border p-5 ${
        emphasis ? "border-brand/30 bg-cream" : "border-line bg-white"
      }`}
    >
      <p className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
        {label}
      </p>
      <p
        className={`mt-2 text-[clamp(1.6rem,3.4vw,2.15rem)] leading-none font-bold tabular-nums ${
          emphasis ? "text-brand" : "text-charcoal"
        }`}
      >
        {value}
      </p>
      {note && <p className="mt-2 text-[13.5px] leading-snug text-body-mute">{note}</p>}
    </div>
  );
}
