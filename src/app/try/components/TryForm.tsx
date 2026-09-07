"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Arrow from "@/components/site/Arrow";
import { useOpenDemoStore } from "@/components/site/OpenDemoStore";
import type { TrialLeadResponse } from "@/lib/preview/types";

/* Both checks mirror /api/trial-lead, so the visitor sees our sentence rather
   than a 400 they cannot act on. Deliberately loose: a marketing form should
   reject the obvious typo and nothing else. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Turns whatever they typed into a bare host, or null if it can't be one.
 *
 * People paste `https://mystore.com/collections/all` as often as they type
 * `mystore.com`, so the scheme, the userinfo, the port and everything from the
 * first slash are stripped rather than rejected. What survives is echoed back
 * under the field, so there is never a question about what we understood.
 */
export function normaliseStore(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  const host = trimmed
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/^\/+/, "")
    .split(/[/?#]/)[0]
    .replace(/^[^@]*@/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");

  if (!host.includes(".") || host.startsWith(".")) return null;
  if (host.length > 253) return null;
  return host;
}

export default function TryForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { form: demoStoreForm, open: openDemoStore } = useOpenDemoStore();

  const ids = useId();
  const storeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [store, setStore] = useState(() => params.get("store") ?? "");
  const [email, setEmail] = useState("");
  const [storeError, setStoreError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const host = normaliseStore(store);

  const go = async (target: string, address: string) => {
    const to = (token?: string) =>
      `/try/preview?store=${encodeURIComponent(target)}${
        token ? `&t=${encodeURIComponent(token)}` : ""
      }&o=1`;

    try {
      const res = await fetch("/api/trial-lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: address, source: "try", store: target }),
        /* A stalled POST is the same outcome as a failed one, and worse for
           the visitor: the demo tab is already open and this page would sit
           on "Opening your preview…" forever. Six seconds, then move. */
        signal: AbortSignal.timeout(6000),
      });
      const data = (await res.json()) as TrialLeadResponse;
      if (data.ok && data.token) {
        router.push(to(data.token));
        return;
      }
    } catch {
      /* Covers both the network failure and the six-second abort — see below. */
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

    /* Synchronous, and before the fetch: a form submit inherits the click's
       transient activation, but Safari drops that activation across an await,
       and the new tab would then be eaten as a popup. The lead call runs
       afterwards and the navigation waits on it. */
    openDemoStore();
    void go(host, address);
  };

  return (
    /* The demo-store form is a sibling, not a child: a <form> inside a <form>
       is invalid HTML, and the parser silently drops the inner one — which
       would leave `open()` with nothing to submit. */
    <>
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
              The preview opens right here. We&apos;ll use your address to
              follow up about Growmerce &mdash; see our{" "}
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

        {/* The follow-up and the privacy link moved up beside the email field;
            what is left here is the claim about the store, which belongs with
            the button rather than with either input. */}
        <p className="mt-5 text-[12.5px] leading-relaxed text-muted">
          No card, no install, and we never touch your storefront &mdash; we
          only read the public page.
        </p>
      </form>
      {demoStoreForm}
    </>
  );
}
