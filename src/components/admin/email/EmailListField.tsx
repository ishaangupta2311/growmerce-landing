"use client";

import { X } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { EmailListState } from "@/app/admin/_actions/email";

/**
 * A list of email addresses, each removable, with a box to add more. Every add
 * or remove saves at once. The form sends only the change, never the list it
 * shows, so a page open for a while cannot bring back an address that
 * unsubscribed since; the list shown is always the page's, refreshed by the
 * save. Several addresses can be pasted into the box at once. While a save is
 * in progress the whole field waits, so a second click is not lost.
 *
 * Each remove button is its own form. In one form, Enter in the box would
 * press the first submit button, which would be the first address's remove.
 *
 * The box is controlled: React resets an uncontrolled field once a form action
 * finishes, which would wipe what was typed when a save is refused.
 */
export default function EmailListField({
  action: save,
  value,
  label,
  shop,
  placeholder = "name@example.com",
  keepOne = false,
}: {
  action: (state: EmailListState, form: FormData) => Promise<EmailListState>;
  value: string[];
  /** Names the list for screen readers, e.g. "Weekly report copies for a.myshopify.com". */
  label: string;
  /** The store the list belongs to, sent with the form. */
  shop?: string;
  placeholder?: string;
  /** The last address cannot be removed. */
  keepOne?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [state, action, pending] = useActionState<EmailListState, FormData>(async (previous, form) => {
    const next = await save(previous, form);
    if (!next?.error && form.has("add")) setDraft("");
    return next;
  }, undefined);
  const emails = value;
  const store = shop ? <input type="hidden" name="shop" value={shop} /> : null;

  return (
    <div className="flex min-w-[17rem] flex-col gap-2" aria-busy={pending}>
      {emails.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={label}>
          {emails.map((email) => (
            <li key={email}>
              <form
                action={action}
                className="flex items-center gap-1 rounded-full border border-line bg-cream py-0.5 pl-3 pr-1 text-[13.5px] text-charcoal"
              >
                {store}
                <span className="break-all">{email}</span>
                {!(keepOne && emails.length === 1) && <RemoveButton email={email} disabled={pending} />}
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={action} className="flex items-center gap-2">
        {store}
        <input
          type="text"
          readOnly={pending}
          inputMode="email"
          autoComplete="off"
          name="add"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label={`Add to ${label}`}
          className="w-full min-w-0 rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[14px] text-charcoal placeholder:text-muted focus:border-brand focus:outline-none"
        />
        <AddButton disabled={pending} />
      </form>
      {(state?.error || state?.notice) && (
        <p role={state.error ? "alert" : "status"} className={`text-[13px] ${state.error ? "text-brand" : "text-body-mute"}`}>
          {state.error ?? state.notice}
        </p>
      )}
    </div>
  );
}

function AddButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled}
      className="shrink-0 rounded-[8px] border border-line bg-white px-3 py-1.5 text-[13.5px] font-bold text-charcoal transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
    >
      {pending ? "Saving…" : "Add"}
    </button>
  );
}

function RemoveButton({ email, disabled }: { email: string; disabled: boolean }) {
  return (
    <button
      type="submit"
      name="remove"
      value={email}
      disabled={disabled}
      aria-label={`Remove ${email}`}
      className="grid size-6 shrink-0 place-items-center rounded-full text-body-mute transition-colors hover:bg-white hover:text-brand disabled:opacity-50"
    >
      <X className="size-3.5" aria-hidden />
    </button>
  );
}
