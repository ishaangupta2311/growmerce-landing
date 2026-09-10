/**
 * What a table says when it has nothing in it.
 *
 * Always a sentence about what will put something there, never "No data". A
 * partner who has just joined sees these on every page of their dashboard, and
 * they are the only instructions the product gives them.
 */
export default function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-line bg-cream/60 px-6 py-12 text-center">
      <p className="font-poppins text-[16px] font-bold text-charcoal">{title}</p>
      {children && (
        <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] leading-relaxed text-body-mute">
          {children}
        </p>
      )}
    </div>
  );
}
