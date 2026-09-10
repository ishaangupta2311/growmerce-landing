/**
 * The strip a form uses to say what went wrong, or that it worked.
 *
 * `role="alert"` on the failure and `role="status"` on the success, which is
 * the difference between interrupting a screen reader and waiting its turn. A
 * message that appears where somebody was already looking is worth nothing to
 * the person who cannot see it appear.
 */
export default function FormBanner({ state }: { state?: { error?: string; notice?: string } }) {
  if (!state?.error && !state?.notice) return null;

  const failed = Boolean(state.error);

  return (
    <p
      role={failed ? "alert" : "status"}
      className={
        failed
          ? "rounded-[10px] border border-brand/30 bg-cream px-4 py-3 text-[14.5px] leading-snug text-brand"
          : "rounded-[10px] border border-line bg-cream px-4 py-3 text-[14.5px] leading-snug text-body-mute"
      }
    >
      {state.error ?? state.notice}
    </p>
  );
}
