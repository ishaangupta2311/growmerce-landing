import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "@/lib/clsx";
import type { PostStatus } from "@/lib/blog/types";

/**
 * The admin panel's small component kit. Plain components with no state, so
 * both server and client components can use them; the stateful pieces
 * (modal, toasts) live in their own client files.
 */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dangerGhost";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-sm hover:bg-[#e94e14] active:bg-[#d44510]",
  secondary: "border border-zinc-200 bg-white text-zinc-800 shadow-xs hover:bg-zinc-50 hover:border-zinc-300",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  dangerGhost: "text-red-600 hover:bg-red-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-[13px]",
  md: "h-9 gap-2 px-3.5 text-sm",
  lg: "h-10 gap-2 px-4 text-sm",
  icon: "size-8 text-sm",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return clsx(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

const CONTROL =
  "w-full rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:bg-zinc-50 disabled:text-zinc-500 aria-invalid:border-red-400 aria-invalid:focus:ring-red-500/15";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={clsx(CONTROL, "h-9 px-3", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={clsx(CONTROL, "px-3 py-2 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={clsx("relative", className)}>
      <select className={clsx(CONTROL, "h-9 appearance-none pr-8 pl-3")} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  counter,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  /** e.g. { value: 54, recommended: 60 } — turns amber past the recommendation. */
  counter?: { value: number; recommended: number };
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-zinc-700">
          {label}
        </label>
        {counter && (
          <span
            className={clsx(
              "text-xs tabular-nums",
              counter.value > counter.recommended ? "font-semibold text-amber-600" : "text-zinc-400",
            )}
          >
            {counter.value}/{counter.recommended}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={clsx("rounded-xl border border-zinc-200 bg-white shadow-xs", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={clsx("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1 text-[13px] font-semibold text-zinc-500 hover:text-zinc-900"
          >
            <ChevronLeft aria-hidden className="size-4" />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<PostStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STATUS_STYLE[status],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-3 grid size-11 place-items-center rounded-full bg-zinc-100 text-zinc-500">{icon}</div>}
      <p className="text-sm font-bold text-zinc-900">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-zinc-500">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Numbered pagination that keeps the current query string. */
export function Pagination({
  page,
  pageCount,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    if (target > 1) query.set("page", String(target));
    const text = query.toString();
    return text ? `${basePath}?${text}` : basePath;
  };

  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
      <p className="text-xs text-zinc-500">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <ButtonLink href={href(page - 1)} size="icon" variant="ghost" aria-label="Previous page">
            <ChevronLeft className="size-4" />
          </ButtonLink>
        ) : (
          <span className={buttonClass("ghost", "icon", "opacity-40")} aria-hidden>
            <ChevronLeft className="size-4" />
          </span>
        )}
        {sorted.map((n, i) => (
          <span key={n} className="flex items-center gap-1">
            {i > 0 && n - sorted[i - 1] > 1 && <span className="px-1 text-xs text-zinc-400">…</span>}
            <ButtonLink
              href={href(n)}
              size="icon"
              variant={n === page ? "secondary" : "ghost"}
              aria-current={n === page ? "page" : undefined}
              className={n === page ? "text-brand" : undefined}
            >
              {n}
            </ButtonLink>
          </span>
        ))}
        {page < pageCount ? (
          <ButtonLink href={href(page + 1)} size="icon" variant="ghost" aria-label="Next page">
            <ChevronRight className="size-4" />
          </ButtonLink>
        ) : (
          <span className={buttonClass("ghost", "icon", "opacity-40")} aria-hidden>
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
