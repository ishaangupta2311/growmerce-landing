"use client";

import { useCallback, useRef, type ReactNode, type RefObject } from "react";
import { DEMO_STORE, DEMO_STORE_PASSWORD } from "@/lib/site-urls";

/**
 * Opens the password-protected demo storefront already unlocked.
 *
 * Shopify's `/password` page accepts a plain cross-site form POST, so a hidden
 * form submitted with `target="_blank"` lands the new tab on the open store
 * with no password step — verified with curl: the correct password answers 302
 * with a session cookie, a wrong one keeps you on the door.
 *
 * It has to be a real form submit rather than `window.open`: the submit is
 * synchronous, so it inherits the click's transient activation and survives
 * popup blockers. That is also why callers must call `open()` *before* any
 * `await` — Safari drops the activation across a microtask boundary.
 *
 * Nothing on our page reads the new tab, and `rel` strips the opener from it,
 * so the storefront can never reach back into this document.
 */
function DemoStoreForm({ formRef }: { formRef: RefObject<HTMLFormElement | null> }) {
  return (
    <form
      ref={formRef}
      method="post"
      action={`${DEMO_STORE}/password`}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden
      tabIndex={-1}
      className="hidden"
    >
      <input type="hidden" name="form_type" value="storefront_password" readOnly />
      <input type="hidden" name="utf8" value="✓" readOnly />
      <input type="hidden" name="password" value={DEMO_STORE_PASSWORD} readOnly />
    </form>
  );
}

/**
 * Returns the hidden form to render and the imperative `open()` that submits
 * it. Split this way so a caller can fire it from inside a submit handler it
 * already owns — the /try form opens the store in the same gesture that sends
 * the lead.
 */
export function useOpenDemoStore(): { form: ReactNode; open: () => void } {
  const formRef = useRef<HTMLFormElement>(null);

  const open = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  return { form: <DemoStoreForm formRef={formRef} />, open };
}

/** The simple case: a button that does nothing but open the store. */
export function OpenDemoStoreButton({
  className,
  children = "Open the demo store",
  onOpened,
}: {
  className?: string;
  children?: ReactNode;
  onOpened?: () => void;
}) {
  const { form, open } = useOpenDemoStore();

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          open();
          onOpened?.();
        }}
      >
        {children}
      </button>
      {form}
    </>
  );
}
