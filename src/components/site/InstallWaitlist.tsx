"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Arrow from "./Arrow";
import { normaliseStoreInput } from "@/lib/store-domain";

/* Character-for-character the check in /api/waitlist, so the merchant sees our
   sentence rather than a 400 they cannot act on. Deliberately loose: a
   marketing form should reject the obvious typo and nothing else. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Step = "form" | "done";

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
 * What "Install on Shopify" does while the listing is still in review.
 *
 * The button promises an install and we cannot deliver one yet, so the panel's
 * first job is to say that in its heading before it asks for anything — a form
 * that appears where an App Store page was expected has to explain itself
 * immediately or it reads as a trick. Only then does it take the store and the
 * address, which is all we need to write to them on launch day.
 *
 * It is the same panel as the demo-store gate on purpose: same backdrop, same
 * focus trap, same escape and scroll-lock rules. A visitor who has met one
 * already knows how to leave this one.
 *
 * This component does not decide *whether* to appear — `InstallOnShopify`
 * does, from `SHOPIFY_LISTING_LIVE`. When the listing goes live this stops
 * being rendered anywhere, and can be deleted along with the flag.
 */
export default function InstallWaitlist({
  className,
  children = "Install on Shopify",
  source = "unknown",
  onOpen,
}: {
  className?: string;
  children?: React.ReactNode;
  /** Which CTA this is, recorded on the row so the launch email can differ. */
  source?: string;
  /** Fired as the panel opens — a nav sheet uses it to get out of the way. */
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");

  const [store, setStore] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [storeError, setStoreError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  /* "The server refused it" belongs under the button, not under a field —
      there is no single input it is about. */
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  /* Held from the successful submit so the confirmation can name the store
     back, rather than the raw thing they typed. */
  const [saved, setSaved] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);

  const ids = useId();
  const titleId = `${ids}-title`;

  /* The server's own rule, not a friendlier approximation of it — see
     @/lib/store-domain. Anything this accepts, /api/waitlist accepts. */
  const host = normaliseStoreInput(store);

  /* Reopening starts at the form again, and the store field is the only one
     cleared: a merchant who comes back is almost always adding a *second*
     shop, and retyping their own name and address to do it is a tax. The
     duplicate that a genuinely accidental re-submit produces costs nothing —
     the table dedups on (store, email). */
  const close = () => {
    setOpen(false);
    setStep("form");
    setStore("");
    setStoreError(null);
    setEmailError(null);
    setFormError(null);
    setSending(false);
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
        "a[href], button:not([disabled]), input:not([disabled])",
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

  // Put the caret where the merchant has to act, on each step.
  useEffect(() => {
    if (!open) return;
    if (step === "form") storeRef.current?.focus();
    else doneRef.current?.focus();
  }, [open, step]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const target = host;
    const address = email.trim();

    /* Both checks before either report, so someone with two things wrong is
       told both at once rather than made to submit twice. */
    const badStore = target
      ? null
      : "That doesn't look like a store address yet — try yourstore.com.";
    const badEmail = EMAIL.test(address)
      ? null
      : "That address looks incomplete — check it and try again.";
    setStoreError(badStore);
    setEmailError(badEmail);
    if (badStore || badEmail) {
      /* The caret goes to the first field that is wrong, so a keyboard user is
         put where the work is rather than left at the button. */
      (badStore ? storeRef : emailRef).current?.focus();
      return;
    }

    setFormError(null);
    setSending(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: address,
          store: target,
          name: name.trim() || undefined,
          source,
        }),
      });

      if (!res.ok) {
        /* The only refusals that survive the checks above are ours to explain,
           not theirs to fix — say what to do next instead of restating the
           status code. */
        setSending(false);
        setFormError(
          res.status === 429
            ? "That's a few tries in a row — give it a minute and we'll take it."
            : "We couldn't save your place just then. Try once more, or email admin@growmerce.ai and we'll add you by hand.",
        );
        return;
      }
    } catch {
      setSending(false);
      setFormError(
        "We couldn't reach the server. Check your connection and try once more.",
      );
      return;
    }

    setSending(false);
    setSaved(target);
    setStep("done");
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
        <Arrow className="cta-arrow size-5" />
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
                    {step === "form" ? "In App Store review" : "You're on the list"}
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

                {step === "form" ? (
                  <>
                    <h2
                      id={titleId}
                      className="font-poppins mt-3 text-[clamp(1.5rem,6vw,1.75rem)] leading-[1.12] font-extrabold tracking-[-0.02em] text-charcoal"
                    >
                      Get the install link first.
                    </h2>
                    <p className="mt-3 text-[15.5px] leading-relaxed text-body-mute">
                      Shopify is still reviewing the Growsearch listing, so
                      there&apos;s nothing to install today. Tell us which store
                      it&apos;s for and we&apos;ll send your link the day it
                      goes live &mdash; before we announce it anywhere else.
                    </p>

                    <form onSubmit={submit} noValidate className="mt-6">
                      <label
                        htmlFor={`${ids}-store`}
                        className="font-poppins text-[12px] font-bold tracking-[0.1em] text-charcoal uppercase"
                      >
                        Your store
                      </label>
                      <input
                        ref={storeRef}
                        id={`${ids}-store`}
                        name="store"
                        type="text"
                        inputMode="url"
                        autoComplete="url"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="yourstore.com"
                        value={store}
                        onChange={(e) => {
                          setStore(e.target.value);
                          if (storeError) setStoreError(null);
                        }}
                        aria-invalid={storeError ? true : undefined}
                        aria-describedby={
                          storeError ? `${ids}-store-error` : `${ids}-store-hint`
                        }
                        className={`mt-2 w-full rounded-[10px] border-2 bg-cream px-4 py-3 text-[16px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-brand focus:bg-white ${
                          storeError ? "border-brand" : "border-line"
                        }`}
                      />
                      {storeError ? (
                        <p
                          id={`${ids}-store-error`}
                          role="alert"
                          className="mt-2 text-[13.5px] font-semibold text-brand"
                        >
                          {storeError}
                        </p>
                      ) : (
                        <p
                          id={`${ids}-store-hint`}
                          className="mt-2 min-h-[1.25rem] text-[13.5px] text-muted"
                        >
                          {host ? (
                            <>
                              We&apos;ll hold your place for{" "}
                              <span className="font-semibold text-charcoal">
                                {host}
                              </span>
                            </>
                          ) : (
                            "Your .myshopify.com address works too."
                          )}
                        </p>
                      )}

                      <label
                        htmlFor={`${ids}-email`}
                        className="font-poppins mt-4 block text-[12px] font-bold tracking-[0.1em] text-charcoal uppercase"
                      >
                        Your email
                      </label>
                      <input
                        ref={emailRef}
                        id={`${ids}-email`}
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@yourstore.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError(null);
                        }}
                        aria-invalid={emailError ? true : undefined}
                        aria-describedby={
                          emailError ? `${ids}-email-error` : undefined
                        }
                        className={`mt-2 w-full rounded-[10px] border-2 bg-cream px-4 py-3 text-[16px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-brand focus:bg-white ${
                          emailError ? "border-brand" : "border-line"
                        }`}
                      />
                      {emailError ? (
                        <p
                          id={`${ids}-email-error`}
                          role="alert"
                          className="mt-2 text-[13.5px] font-semibold text-brand"
                        >
                          {emailError}
                        </p>
                      ) : null}

                      {/* Last, and marked optional in the label rather than
                          only in a hint — it makes launch day a letter instead
                          of a broadcast, but nobody loses their place for
                          skipping it. */}
                      <label
                        htmlFor={`${ids}-name`}
                        className="font-poppins mt-4 block text-[12px] font-bold tracking-[0.1em] text-charcoal uppercase"
                      >
                        Your name{" "}
                        <span className="font-semibold text-muted lowercase tracking-normal">
                          (optional)
                        </span>
                      </label>
                      <input
                        id={`${ids}-name`}
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Alex"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-2 w-full rounded-[10px] border-2 border-line bg-cream px-4 py-3 text-[16px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-brand focus:bg-white"
                      />

                      <button
                        type="submit"
                        disabled={sending}
                        className="cta-primary mt-5 w-full max-[359px]:gap-2 max-[359px]:px-4 max-[359px]:text-[15px] disabled:opacity-70"
                      >
                        {sending ? "Saving your place…" : "Save my place"}
                        {sending ? null : <Arrow className="cta-arrow" />}
                      </button>

                      {formError ? (
                        <p
                          role="alert"
                          className="mt-3 text-[13px] leading-relaxed font-semibold text-brand"
                        >
                          {formError}
                        </p>
                      ) : null}
                    </form>

                    <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
                      No card, and nothing is installed on your store. We&apos;ll
                      use your email to tell you the listing is live and to
                      follow up about Growmerce &mdash; see our{" "}
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
                      Your place is saved.
                    </h2>

                    {/* Naming the store back is the receipt: it is the one
                        field they could have fat-fingered in a way we cannot
                        detect, and the one we act on at launch. */}
                    <div className="mt-5 rounded-[14px] border-2 border-dashed border-brand/40 bg-cream px-5 py-4">
                      <p className="font-poppins text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
                        Holding a spot for
                      </p>
                      <p className="font-poppins mt-1.5 text-[19px] leading-tight font-extrabold break-all text-brand">
                        {saved}
                      </p>
                    </div>

                    <p className="mt-4 text-[15.5px] leading-relaxed text-body-mute">
                      We&apos;ll email you the install link the day the listing
                      clears review. Nothing else lands in your inbox in the
                      meantime.
                    </p>
                    <p className="mt-3 text-[15.5px] leading-relaxed text-body-mute">
                      Don&apos;t want to wait to see it work? Growsearch is
                      already running on our demo storefront, and{" "}
                      <Link
                        href="/try"
                        className="font-semibold text-charcoal underline underline-offset-2 hover:text-brand"
                      >
                        we&apos;ll draw it on your own store
                      </Link>{" "}
                      in about twenty seconds.
                    </p>

                    <button
                      ref={doneRef}
                      type="button"
                      onClick={close}
                      className="cta-primary mt-6 w-full max-[359px]:gap-2 max-[359px]:px-4 max-[359px]:text-[15px]"
                    >
                      Back to the site
                      <Arrow className="cta-arrow" />
                    </button>
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
