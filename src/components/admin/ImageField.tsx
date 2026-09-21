"use client";

import { useState } from "react";
import { ImagePlus, Link2, RefreshCw, X } from "lucide-react";
import { clsx } from "@/lib/clsx";
import MediaPicker from "./MediaPicker";
import Thumb from "./Thumb";
import { Button, Field, Input } from "./ui";

/** An image chosen from the library, or pasted as a URL. */
export default function ImageField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  aspect = "aspect-[16/9]",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  aspect?: string;
}) {
  const [picking, setPicking] = useState(false);
  const [pasting, setPasting] = useState(false);

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      {value ? (
        <div className="group relative">
          <Thumb src={value} className={clsx("w-full rounded-lg border border-zinc-200", aspect)} sizes="320px" />
          <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <Button size="sm" onClick={() => setPicking(true)} aria-label={`Replace ${label.toLowerCase()}`}>
              <RefreshCw className="size-3.5" />
              Replace
            </Button>
            <Button size="icon" onClick={() => onChange("")} aria-label={`Remove ${label.toLowerCase()}`}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          id={id}
          onClick={() => setPicking(true)}
          className={clsx(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-sm font-semibold transition-colors",
            error ? "border-red-300 text-red-600" : "border-zinc-200 text-zinc-500 hover:border-brand/50 hover:bg-brand/5 hover:text-brand",
            aspect,
          )}
        >
          <ImagePlus className="size-5" />
          Choose from library
        </button>
      )}

      {pasting ? (
        <Input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setPasting(false)}
          placeholder="https://…"
          aria-label={`${label} URL`}
          aria-invalid={Boolean(error) || undefined}
          className="mt-2"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPasting(true)}
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
        >
          <Link2 className="size-3.5" />
          {value ? "Edit URL" : "or paste an image URL"}
        </button>
      )}

      <MediaPicker open={picking} onClose={() => setPicking(false)} onSelect={(item) => onChange(item.url)} title={label} />
    </Field>
  );
}
