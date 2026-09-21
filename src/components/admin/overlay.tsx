"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, LoaderCircle, X } from "lucide-react";
import { clsx } from "@/lib/clsx";
import { Button } from "./ui";

/* ─── Modal ──────────────────────────────────────────────────────────── */

/**
 * A native <dialog> opened with showModal(), so focus trapping, Escape and
 * the inert background come from the browser rather than from us.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={clsx(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/45",
        { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-5xl" }[size],
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-bold">{title}</h2>
              {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </Button>
          </header>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
          {footer && (
            <footer className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}

/** "Are you sure?" with a busy state while the action runs. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = "Delete",
  tone = "danger",
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  pending?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={pending ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={pending} autoFocus>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children && <div className="text-sm leading-relaxed text-zinc-600">{children}</div>}
    </Modal>
  );
}

/* ─── Toasts ─────────────────────────────────────────────────────────── */

type Toast = { id: number; message: string; tone: "success" | "error" };
type Notify = (message: string, tone?: Toast["tone"]) => void;

const ToastContext = createContext<Notify>(() => {});

export function useToast(): Notify {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);

  const notify = useCallback<Notify>((message, tone = "success") => {
    const id = ++next.current;
    setToasts((list) => [...list.slice(-3), { id, message, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), tone === "error" ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-lg"
          >
            {toast.tone === "error" ? (
              <CircleAlert className="mt-px size-4 shrink-0 text-red-600" />
            ) : (
              <CircleCheck className="mt-px size-4 shrink-0 text-emerald-600" />
            )}
            <span className="min-w-0 flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToasts((list) => list.filter((item) => item.id !== toast.id))}
              className="-mr-1 rounded p-0.5 text-zinc-400 hover:text-zinc-700"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Dates ──────────────────────────────────────────────────────────── */

const subscribe = () => () => {};

/** True after hydration; false during SSR and the hydration pass itself. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * A timestamp in the viewer's own timezone. The server does not know it, so
 * the first paint is UTC and the browser swaps in local time after hydration.
 */
export function LocalTime({ iso, mode = "datetime" }: { iso: string | null; mode?: "date" | "datetime" }) {
  const isClient = useIsClient();
  if (!iso) return <span className="text-zinc-400">—</span>;

  const date = new Date(iso);
  const options: Intl.DateTimeFormatOptions =
    mode === "date" ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" };
  const text = date.toLocaleString(isClient ? undefined : "en-GB", isClient ? options : { ...options, timeZone: "UTC" });

  return (
    <time dateTime={iso} title={isClient ? date.toString() : undefined}>
      {text}
    </time>
  );
}
