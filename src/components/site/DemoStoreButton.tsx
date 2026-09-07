"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Arrow from "./Arrow";
import {
  DEMO_STORE_ENTRANCE,
  DEMO_STORE_PASSWORD,
} from "@/lib/site-urls";

/* Mirrors the check in /api/trial-lead so the visitor sees our message rather
   than a 400 they cannot act on. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Step = "email" | "unlocked";

function Close() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Every "See demo" on the site opens the live demo storefront — but that store
 * is password protected, and the email is the toll for the password. Both beats
 * happen in one panel so the visitor never loses the thread, and the password
 * is handed over before they leave, because the store's own door asks for it
 * on arrival.
 *
 * The store opens in a new tab, which is why the last step is a link the
 * visitor clicks rather than a timer: a `window.open` fired from a countdown
 * has no user gesture behind it and popup blockers eat it. Leaving this panel
 * open behind the new tab is deliberate too — it is where the password still
 * is when they get to the door and find they did not copy it.
 */
export default function DemoStoreButton({
  className,
  children = "See demo",
  source = "hero",
  onOpen,
}: {
  className?: string;
  children?: React.ReactNode;
  source?: string;
  /** Fired as the panel opens — the mobile nav uses it to close its sheet,
      which otherwise sits under the panel waiting to be found again. */
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const goRef = useRef<HTMLAnchorElement>(null);

  const titleId = useId();
  const errorId = useId();

  const close = () => {
    setOpen(false);
    setStep("email");
    setError(null);
    setSending(false);
    setCopied(false);
    triggerRef.current?.focus();
  };

  /* The panel covers the viewport; the page behind it must not scroll, or
     dismissing the panel lands the reader somewhere they never chose. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Escape dismisses; Tab stays inside. A modal that leaks focus to the page
     behind it is unusable with a keyboard or a screen reader. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Put the caret where the visitor has to act, on each step.
  useEffect(() => {
    if (!open) return;
    if (step === "email") inputRef.current?.focus();
    else goRef.current?.focus();
  }, [open, step]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError("That address looks incomplete — check it and try again.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setSending(true);
    try {
      await fetch("/api/trial-lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value, source }),
      });
    } catch {
      /* Deliberately ignored. A lead we failed to deliver is our problem to
         fix in the logs; it is not a reason to hold the demo shut. */
    }
    setSending(false);
    setStep("unlocked");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_STORE_PASSWORD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* No clipboard permission — the password is on screen in plain text,
         so there is nothing to recover from. */
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
      >
        {children}
      </button>

      {/* No mounted guard: `open` starts false on both passes and can only be
          flipped by a click, so by the time this portals there is a document
          to portal into. */}
      {open
        ? createPortal(
            <div
              className="gate-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-charcoal/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) close();
              }}
            >
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="gate-panel relative max-h-[calc(100dvh-1rem)] w-full max-w-[456px] overflow-y-auto rounded-t-[26px] bg-white px-6 pt-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] shadow-[0_40px_90px_-30px_rgba(23,23,23,0.55)] sm:rounded-[26px] sm:px-8 sm:pb-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-poppins text-[11px] font-bold tracking-[0.18em] text-brand uppercase">
                    <span
                      aria-hidden
                      className="mr-2 inline-block size-[7px] rounded-full bg-brand align-middle"
                    />
                    {step === "email" ? "Live demo store" : "You're in"}
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-charcoal/50 transition-colors hover:bg-cream hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <Close />
                  </button>
                </div>

                {step === "email" ? (
                  <>
                    <h2
                      id={titleId}
                      className="font-poppins mt-3 text-[clamp(1.5rem,6vw,1.75rem)] leading-[1.12] font-extrabold tracking-[-0.02em] text-charcoal"
                    >
                      Try it on a live storefront.
                    </h2>
                    <p className="mt-3 text-[15.5px] leading-relaxed text-body-mute">
                      Growsearch already runs on a demo Shopify store, so
                      there&apos;s nothing to install. It sits behind a
                      password — tell us where to reach you and we&apos;ll hand
                      it over.
                    </p>

                    <form onSubmit={submit} noValidate className="mt-6">
                      <label
                        htmlFor={`${titleId}-email`}
                        className="font-poppins text-[12px] font-bold tracking-[0.1em] text-charcoal uppercase"
                      >
                        Your email
                      </label>
                      <input
                        ref={inputRef}
                        id={`${titleId}-email`}
                        type="email"
                        name="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@yourstore.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        className={`mt-2 w-full rounded-[10px] border-2 bg-cream px-4 py-3 text-[16px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-brand focus:bg-white ${
                          error ? "border-brand" : "border-line"
                        }`}
                      />
                      {error ? (
                        <p
                          id={errorId}
                          role="alert"
                          className="mt-2 text-[13.5px] font-semibold text-brand"
                        >
                          {error}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={sending}
                        className="cta-primary mt-4 w-full max-[359px]:gap-2 max-[359px]:px-4 max-[359px]:text-[15px] disabled:opacity-70"
                      >
                        {sending ? "Unlocking…" : "Unlock the demo store"}
                        {sending ? null : <Arrow className="cta-arrow" />}
                      </button>
                    </form>

                    <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
                      No card, no install. We&apos;ll use your email to follow
                      up about Growmerce — see our{" "}
                      <Link
                        href="/privacy"
                        className="underline underline-offset-2 hover:text-brand"
                      >
                        privacy policy
                      </Link>
                      .
                    </p>
                  </>
                ) : (
                  <>
                    <h2
                      id={titleId}
                      className="font-poppins mt-3 text-[clamp(1.5rem,6vw,1.75rem)] leading-[1.12] font-extrabold tracking-[-0.02em] text-charcoal"
                    >
                      Here&apos;s the store password.
                    </h2>

                    {/* The store asks for this on arrival, so it has to be
                        readable and grabbable before they go. */}
                    <div className="mt-5 flex items-center justify-between gap-4 rounded-[14px] border-2 border-dashed border-brand/40 bg-cream px-5 py-4">
                      <code className="font-poppins text-[26px] leading-none font-extrabold tracking-[0.08em] text-brand">
                        {DEMO_STORE_PASSWORD}
                      </code>
                      <button
                        type="button"
                        onClick={copy}
                        className="font-poppins shrink-0 rounded-[8px] border-2 border-brand px-3.5 py-1.5 text-[13px] font-bold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p aria-live="polite" className="sr-only">
                      {copied ? "Password copied to clipboard" : ""}
                    </p>

                    <p className="mt-4 text-[15.5px] leading-relaxed text-body-mute">
                      The storefront asks for it before it opens. Paste it in,
                      then search the way a shopper actually talks — &ldquo;something
                      warm for a rainy commute&rdquo;.
                    </p>

                    <a
                      ref={goRef}
                      href={DEMO_STORE_ENTRANCE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cta-primary mt-6 w-full max-[359px]:gap-2 max-[359px]:px-4 max-[359px]:text-[15px]"
                    >
                      Open the demo store
                      <Arrow className="cta-arrow" />
                    </a>

                    <p className="mt-4 text-center text-[12.5px] text-muted">
                      Opens in a new tab. This panel keeps the password if you
                      need it again.
                    </p>
                  </>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
