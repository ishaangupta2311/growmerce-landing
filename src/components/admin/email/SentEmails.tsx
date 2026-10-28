"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { viewSentEmail } from "@/app/admin/_actions/email";
import { LocalTime, Modal } from "@/components/admin/overlay";
import { clsx } from "@/lib/clsx";
import type { Answer, Send, SentEmail } from "@/lib/growsearch/email";

/** One send as the page lists it: the store it went to, and which email. */
export type SendItem = Send & { shop: string; store: string; email: string };

/** The results a send has, latest first. */
const RESULTS = [
  ["complainedAt", "Spam", "bg-red-50 text-red-700"],
  ["bouncedAt", "Bounced", "bg-red-50 text-red-700"],
  ["clickedAt", "Clicked", "bg-emerald-50 text-emerald-700"],
  ["openedAt", "Opened", "bg-emerald-50 text-emerald-700"],
  ["deliveredAt", "Delivered", "bg-zinc-100 text-zinc-700"],
] as const;

function Results({ send }: { send: Send }) {
  const held = RESULTS.filter(([field]) => send[field]);
  if (held.length === 0) return <span className="text-xs text-zinc-400">No result yet</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {held.map(([field, label, tone]) => (
        <span key={field} className={clsx("rounded-full px-2 py-0.5 text-[11.5px] font-semibold", tone)}>
          {label}
        </span>
      ))}
    </span>
  );
}

/** Attributes that can send the frame, or a new window, to a URL. */
const NAVIGATING = new Set(["href", "xlink:href", "target", "action", "formaction"]);

/**
 * The email with nothing in it that can go anywhere: every link loses its
 * URL, every target and form action goes, and a refresh tag is dropped. The
 * copy carries the merchant's working unsubscribe link, and an empty sandbox
 * still lets a link navigate the frame itself. Parsed, not pattern-matched,
 * so an attribute in an unusual form is still found. Runs only in the
 * browser: copies are loaded after the dialog opens.
 */
function inert(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const meta of doc.querySelectorAll("meta[http-equiv]")) {
    if (meta.getAttribute("http-equiv")?.trim().toLowerCase() === "refresh") meta.remove();
  }
  for (const element of doc.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      if (NAVIGATING.has(attribute.name.toLowerCase())) element.removeAttribute(attribute.name);
    }
  }
  return `${doc.doctype ? "<!doctype html>" : ""}${doc.documentElement.outerHTML}`;
}

const keyOf = (send: { shop: string; emailKey: string }) => `${send.shop}\n${send.emailKey}`;

/**
 * Opens the emails behind a row: every store this email went to, and the
 * email itself as that store received it.
 *
 * The copy carries the merchant's real unsubscribe link, so it is shown with
 * its links stripped (see `inert`) in a sandboxed frame with no permissions:
 * nothing in it runs, and nothing in it can navigate.
 */
export default function SentEmails({
  title,
  sends,
  children,
}: {
  title: string;
  sends: SendItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [copies, setCopies] = useState<Record<string, Answer<SentEmail>>>({});

  const send = sends[selected];
  const key = send ? keyOf(send) : "";
  const copy = copies[key];

  useEffect(() => {
    if (!open || !send || copies[key]) return;
    let current = true;
    viewSentEmail(send.shop, send.emailKey)
      .catch(() => ({ ok: false as const, error: "Could not load this email. Try again." }))
      .then((answer) => {
        if (current) setCopies((all) => ({ ...all, [key]: answer }));
      });
    return () => {
      current = false;
    };
  }, [open, send, key, copies]);

  if (sends.length === 0) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-left decoration-brand/40 decoration-dotted underline-offset-4 hover:text-brand hover:underline focus-visible:underline"
      >
        {children}
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          // A failed load is tried again next time; a loaded copy is kept.
          setCopies((all) => Object.fromEntries(Object.entries(all).filter(([, answer]) => answer.ok)));
        }}
        title={title}
        description={sends.length === 1 ? undefined : `Sent ${sends.length} times. Pick one to see it.`}
        size="xl"
      >
        <div className={clsx("grid gap-4", sends.length > 1 && "lg:grid-cols-[15rem_minmax(0,1fr)]")}>
          {sends.length > 1 && (
            <ul className="space-y-1 lg:max-h-[70dvh] lg:overflow-y-auto">
              {sends.map((item, index) => (
                <li key={keyOf(item)}>
                  <button
                    type="button"
                    onClick={() => setSelected(index)}
                    aria-current={index === selected}
                    className={clsx(
                      "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      index === selected
                        ? "border-brand/40 bg-orange-50"
                        : "border-transparent hover:border-zinc-200 hover:bg-zinc-50",
                    )}
                  >
                    <span className="block font-semibold text-zinc-900">{item.store}</span>
                    {item.email !== title && <span className="block text-xs text-zinc-500">{item.email}</span>}
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      <LocalTime iso={item.sentAt} />
                    </span>
                    <span className="mt-1.5 block">
                      <Results send={item} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {send && (
            <div className="min-w-0">
              <div className="mb-3 space-y-1.5">
                <p className="text-sm font-semibold text-zinc-900">
                  {copy?.ok ? (copy.data.subject ?? "(no subject)") : send.email}
                </p>
                <p className="text-xs text-zinc-500">
                  To {send.store} · Sent <LocalTime iso={send.sentAt} />
                </p>
                <Results send={send} />
              </div>
              {!copy ? (
                <div className="flex h-[60dvh] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Loading the email…
                </div>
              ) : copy.ok ? (
                <iframe
                  key={key}
                  title={`${send.email} sent to ${send.store}`}
                  sandbox=""
                  srcDoc={inert(copy.data.html)}
                  className="h-[70dvh] w-full rounded-lg border border-zinc-200 bg-white"
                />
              ) : (
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-600">
                  {copy.error}
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
