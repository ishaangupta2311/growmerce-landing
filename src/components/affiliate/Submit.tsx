"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that knows the form around it is busy.
 *
 * `useFormStatus` reads the state of the nearest parent form, which is why this
 * is its own component rather than a prop on the page: the hook returns
 * `pending: false` when called from the component that renders the `<form>`,
 * and only sees the submission from inside it.
 *
 * Disabling while pending is not cosmetic here. Several of these forms take
 * money-adjacent actions, and a double-clicked "Save payout details" against a
 * slow connection is two writes racing.
 */
export default function Submit({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${variant === "primary" ? "cta-primary" : "cta-secondary"} w-full text-[16px] disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
