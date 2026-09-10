"use client";

import { useEffect, useRef, useState } from "react";

import { formatCode } from "@/lib/affiliate/codes";

/**
 * The affiliate code, and a button that puts it on the clipboard.
 *
 * The code is shown with a dash and copied without one. That is not an
 * inconsistency — `normaliseCode` strips separators on the way in, so both
 * forms resolve to the same partner, and the readable one is what somebody
 * reads off the screen into a phone call while the plain one is what gets
 * pasted into the Growsearch app's settings field.
 *
 * `navigator.clipboard` needs a secure context and is absent on an old browser
 * or a plain-http preview, so the code itself is selectable text and the button
 * is the shortcut rather than the only way. When the write fails the button
 * says so instead of silently pretending; a partner who thinks they copied
 * their code and pastes the last thing they cut is a support ticket.
 */
export default function CopyCode({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Without this, a component unmounted between the copy and the reset — a
     navigation two seconds later — leaves a timer holding a dead setState. */
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2400);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <code className="rounded-[10px] border border-brand/25 bg-white px-4 py-3 font-poppins text-[20px] font-bold tracking-[0.06em] text-brand select-all">
        {formatCode(code)}
      </code>
      <button
        type="button"
        onClick={copy}
        className="cta-secondary px-5 py-2.5 text-[15px]"
        /* Announced rather than only shown: the label changes in place, and a
           screen reader would otherwise never learn the copy succeeded. */
        aria-live="polite"
      >
        {state === "copied" ? "Copied" : state === "failed" ? "Press \u2318C to copy" : "Copy code"}
      </button>
    </div>
  );
}
