"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Arrow from "@/components/site/Arrow";
import type { TrialLeadResponse } from "@/lib/preview/types";
import { normaliseStoreInput } from "@/lib/store-domain";
import { timeoutSignal } from "./net";

/* Character-for-character the server's check, so the visitor sees our sentence
   rather than a 400 they cannot act on. Deliberately loose: a marketing form
   should reject the obvious typo and nothing else. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function TryForm() {
  const router = useRouter();
  const params = useSearchParams();
  const ids = useId();
  const storeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [store, setStore] = useState(() => params.get("store") ?? "");
  const [email, setEmail] = useState("");
  const [storeError, setStoreError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  /* Not about either field — "the server is busy" has no input to sit
     under, so it takes the slot beneath the button. */
  const [formError, setFormError] = useState<string | null>(null);

  /* The server's own rule, not a friendlier approximation of it — see
     @/lib/store-domain. Anything this accepts, /api/trial-lead accepts. */
  const host = normaliseStoreInput(store);

  const go = async (target: string, address: string) => {
    const to = (token?: string) =>
      `/try/preview?store=${encodeURIComponent(target)}${
        token ? `&t=${encodeURIComponent(token)}` : ""
      }`;

    try {
      const res = await fetch("/api/trial-lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: address, source: "try", store: target }),
        /* A stalled POST is the same outcome as a failed one, and worse for
           the visitor: the demo tab is already open and this page would sit
           on "Opening your preview…" forever. Six seconds, then move. */
        signal: timeoutSignal(6000),
      });
      const data = (await res.json()) as TrialLeadResponse;

      if (data.ok) {
        router.push(to(data.token));
        return;
      }

      /* The server refused what we sent. Leaving is the wrong move for any of
         these: the preview page can only tell them to come back and fix it,
         and each round trip pops another demo tab. The answer belongs on the
         page they are already looking at — on the field, where there is one.
         Both sides now run the same domain rule, so the two typed errors are
         the disagreement case rather than the usual one; `rate_limited` is
         the one that shows up in normal use. */
      if (data.error === "rate_limited") {
        setSending(false);
        setFormError(
          "You've tried a few times — give it a minute and we'll pick this back up.",
        );
        return;
      }
      if (data.error === "invalid_store" || data.error === "invalid_email") {
        setSending(false);
        if (data.error === "invalid_store") {
          setStoreError(
            "We couldn't use that domain — check it and try again.",
          );
          storeRef.current?.focus();
        } else {
          setEmailError(
            "That address looks incomplete — check it and try again.",
          );
          emailRef.current?.focus();
        }
        return;
      }
      /* `invalid_body` is our bug, not theirs — fall through rather than
         blame a field they filled in correctly. */
    } catch {
      /* Network failure or the six-second abort. Both mean we never heard
         back, which is not the visitor's problem to solve. */
    }

    /* No token, or the call never landed. The preview page shows its
       "couldn't verify" state from here, which is a page with the demo store
       and a way back on it. Stranding the visitor on a spinner is the one
       outcome that is not allowed. */
    router.push(to());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const address = email.trim();
    setFormError(null);
    const badStore = !host;
    const badEmail = !EMAIL.test(address);

    setStoreError(
      badStore
        ? "That doesn't look like a domain — try something like yourstore.com."
        : null,
    );
    setEmailError(
      badEmail
        ? "That address looks incomplete — check it and try again."
        : null,
    );

    if (badStore) {
      storeRef.current?.focus();
      return;
    }
    if (badEmail) {
      emailRef.current?.focus();
      return;
    }

    setSending(true);

    /* Nothing opens a tab from here. Submitting this form asks one question —
       "what would Growsearch look like on my store" — and popping a second
       storefront over the answer was us answering a question nobody asked.
       The demo store is still one click away on the preview page. */
    void go(host, address);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div>
        <label
          htmlFor={`${ids}-store`}
          className="font-poppins text-[12px] font-bold tracking-[0.1em] text-charcoal uppercase"
        >
          Your store&apos;s domain
        </label>
        <input
          ref={storeRef}
          id={`${ids}-store`}
          name="store"
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
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
          className={`mt-2 w-full rounded-[10px] border-2 bg-cream px-4 py-3.5 text-[16px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-brand focus:bg-white ${
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
                We&apos;ll look at{" "}
                <span className="font-semibold text-charcoal">
                  https://{host}
                </span>
              </>
            ) : (
              "Paste the whole URL if that's easier — we'll trim it."
            )}
          </p>
        )}
      </div>

      <div className="mt-5">
        <label
          htmlFor={`${ids}-email`}
          className="font-poppins text-[12px] font-bold tracking-[0.1em] text-charcoal uppercase"
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
            emailError ? `${ids}-email-error` : `${ids}-email-hint`
          }
          className={`mt-2 w-full rounded-[10px] border-2 bg-cream px-4 py-3.5 text-[16px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-brand focus:bg-white ${
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
        ) : (
          /* The label used to say "where to send your plan", which promised
               an email we do not send. The address is for follow-up, so it
               says so — next to the field it is asking for. */
          <p
            id={`${ids}-email-hint`}
            className="mt-2 text-[13.5px] leading-relaxed text-muted"
          >
            The preview opens right here. We&apos;ll use your address to follow
            up about Growmerce &mdash; see our{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-brand"
            >
              privacy policy
            </Link>
            .
          </p>
        )}
      </div>

      {/* Below 430px a button at its own width reads as a mistake, so it takes
          the column — the same rule CtaPair follows everywhere else. */}
      <button
        type="submit"
        disabled={sending}
        className="cta-primary mt-7 max-[430px]:w-full max-[359px]:gap-2 max-[359px]:px-4 max-[359px]:text-[15px] disabled:opacity-70"
      >
        {sending ? "Opening your preview…" : "Show me my store"}
        {sending ? null : <Arrow className="cta-arrow size-5" />}
      </button>

      {/* One slot, two tenants. The reassurance is what belongs under the
            button; a "come back in a minute" is more use than reassurance the
            moment there is one, and it has no field of its own to sit under.
            The reserved height keeps the swap from moving the page — the
            follow-up and the privacy link live beside the email field now, so
            all that is left here is the claim about the store. */}
      <div className="mt-5 min-h-[2.75rem]">
        {formError ? (
          <p
            role="alert"
            className="text-[13px] leading-relaxed font-semibold text-brand"
          >
            {formError}
          </p>
        ) : (
          <p className="text-[12.5px] leading-relaxed text-muted">
            No card, no install, and we never touch your storefront &mdash; we
            only read the public page.
          </p>
        )}
      </div>
    </form>
  );
}
