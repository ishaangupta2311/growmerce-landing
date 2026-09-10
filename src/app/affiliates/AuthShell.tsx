/**
 * The card the sign-in, sign-up, reset and apply pages sit in.
 *
 * One narrow column, centred, with the heading outside the card and the form
 * inside it. Shared so the four pages cannot drift apart in width, spacing or
 * where the heading sits — which is exactly what happens to auth pages, because
 * each one is written on a different day for a different reason.
 */
export default function AuthShell({
  title,
  lede,
  notice,
  children,
}: {
  title: string;
  lede?: string;
  notice?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-12 sm:py-16">
      <h1 className="text-[clamp(1.75rem,4.4vw,2.4rem)] leading-[1.15] font-bold">{title}</h1>
      {lede && (
        <p className="mt-3 text-[16.5px] leading-relaxed text-body-mute">{lede}</p>
      )}

      {notice && (
        <p
          role="status"
          className="mt-6 rounded-[10px] border border-brand/25 bg-cream px-4 py-3 text-[14.5px] leading-snug text-brand"
        >
          {notice}
        </p>
      )}

      <div className="mt-8 rounded-[16px] border border-line bg-white p-6 sm:p-8">{children}</div>
    </div>
  );
}
