"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that carries the value it is submitting.
 *
 * The status form has four of these in it — approve, reject, suspend, return to
 * the queue — and the browser submits `name`/`value` for whichever one was
 * pressed. That is the whole mechanism, and it means the form works without
 * JavaScript and without four separate forms.
 *
 * `confirm` on the destructive ones. It is a blunt instrument, and it is the
 * right one here: suspending a partner takes their dashboard away mid-session,
 * and the button that does it sits three pixels from the one that approves
 * them. Everything these buttons do is reversible, so a dialog is enough — a
 * typed confirmation would be theatre.
 */
export default function ActionButton({
  name,
  value,
  children,
  tone = "quiet",
  confirmText,
}: {
  name: string;
  value: string;
  children: React.ReactNode;
  tone?: "primary" | "quiet" | "danger";
  confirmText?: string;
}) {
  const { pending } = useFormStatus();

  const styles = {
    primary: "border-brand bg-brand text-white hover:bg-brand/90",
    quiet: "border-line bg-white text-charcoal hover:border-brand hover:text-brand",
    danger: "border-line bg-white text-body-mute hover:border-brand hover:text-brand",
  }[tone];

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
      className={`rounded-[10px] border px-4 py-2.5 font-poppins text-[14.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
    >
      {children}
    </button>
  );
}
