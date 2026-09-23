"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { Check, Copy, Eye, ImageIcon, LoaderCircle, Trash2, Upload } from "lucide-react";
import { deleteMediaAction, updateMediaAltAction } from "@/app/admin/_actions/media";
import { uploadFiles } from "@/components/admin/media-upload";
import { ConfirmDialog, LocalTime, Modal, useToast } from "@/components/admin/overlay";
import Thumb from "@/components/admin/Thumb";
import UrlSearch from "@/components/admin/UrlSearch";
import { Button, EmptyState, Field, Input, formatBytes } from "@/components/admin/ui";
import { MEDIA_ACCEPT, type MediaItem } from "@/lib/blog/types";
import { clsx } from "@/lib/clsx";

export default function MediaLibrary({ items, query }: { items: MediaItem[]; query: string }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [viewing, setViewing] = useState<MediaItem | null>(null);
  const [alt, setAlt] = useState("");
  const [deleting, setDeleting] = useState<{ item: MediaItem; inUse: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: File[]) {
    if (files.length === 0) return;
    setProgress(`Uploading 0 of ${files.length}…`);
    const report = await uploadFiles(files, (done, total) => setProgress(`Uploading ${done} of ${total}…`));
    setProgress(null);
    if (input.current) input.current.value = "";
    report.errors.forEach((message) => notify(message, "error"));
    if (report.uploaded.length > 0) {
      notify(`${report.uploaded.length} image${report.uploaded.length === 1 ? "" : "s"} uploaded and optimized.`);
      router.refresh();
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void upload(Array.from(event.dataTransfer.files));
  }

  async function copyUrl(item: MediaItem) {
    const url = new URL(item.url, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(item.id);
      window.setTimeout(() => setCopied((current) => (current === item.id ? null : current)), 1600);
      notify("Image URL copied.");
    } catch {
      window.prompt("Copy this URL:", url);
    }
  }

  function askDelete(item: MediaItem) {
    startTransition(async () => {
      const result = await deleteMediaAction(item.id, false);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      /* The first call only checks usage; it deletes when nothing uses it. */
      if (result.data.inUse > 0) {
        setDeleting({ item, inUse: result.data.inUse });
      } else {
        notify(result.message ?? "Image deleted.");
        setViewing(null);
      }
    });
  }

  function forceDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteMediaAction(deleting.item.id, true);
      if (!result.ok) notify(result.error, "error");
      else notify(result.message ?? "Image deleted.");
      setDeleting(null);
      setViewing(null);
    });
  }

  function saveAlt() {
    if (!viewing) return;
    startTransition(async () => {
      const result = await updateMediaAltAction(viewing.id, alt);
      if (!result.ok) notify(result.error, "error");
      else {
        notify(result.message ?? "Saved.");
        setViewing({ ...viewing, altText: alt.trim() || null });
      }
    });
  }

  return (
    <>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          "mb-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-white px-6 py-8 text-center transition-colors",
          dragging ? "border-brand bg-brand/5" : "border-zinc-200 hover:border-brand/50",
        )}
      >
        <input
          ref={input}
          type="file"
          accept={MEDIA_ACCEPT}
          multiple
          className="sr-only"
          onChange={(event) => upload(Array.from(event.target.files ?? []))}
          disabled={Boolean(progress)}
        />
        <span className="grid size-11 place-items-center rounded-full bg-brand/10 text-brand">
          {progress ? <LoaderCircle className="size-5 animate-spin" /> : <Upload className="size-5" />}
        </span>
        <span className="text-sm font-bold text-zinc-900">{progress ?? "Drop images here, or click to upload"}</span>
        <span className="text-xs text-zinc-500">JPEG, PNG, WebP, GIF or AVIF up to 4 MB. Converted to WebP and resized to 2400px max.</span>
      </label>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="border-b border-zinc-100 p-3 sm:p-4">
          <UrlSearch placeholder="Search images by name or alt text…" className="sm:max-w-sm" />
        </div>

        {items.length === 0 ? (
          <EmptyState icon={<ImageIcon className="size-5" />} title={query ? "No images match" : "No images yet"}>
            {query ? "Try a different search." : "Uploaded images appear here, ready to use in posts."}
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:gap-4 sm:p-4 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((item) => (
              <li key={item.id} className="group overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setViewing(item);
                    setAlt(item.altText ?? "");
                  }}
                  className="block w-full"
                  aria-label={`Preview ${item.filename}`}
                >
                  <Thumb src={item.url} alt={item.altText ?? ""} className="aspect-square w-full rounded-none" sizes="(min-width: 1280px) 200px, 45vw" />
                </button>
                <div className="p-2">
                  <p className="truncate text-xs font-semibold text-zinc-800" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {item.width}×{item.height} · {formatBytes(item.sizeBytes)}
                  </p>
                  <div className="mt-1.5 flex gap-0.5">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => copyUrl(item)} aria-label="Copy URL" title="Copy URL">
                      {copied === item.id ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setViewing(item);
                        setAlt(item.altText ?? "");
                      }}
                      aria-label="Preview"
                      title="Preview"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto size-7 hover:bg-red-50 hover:text-red-600"
                      onClick={() => askDelete(item)}
                      disabled={pending}
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.filename ?? ""}
        size="lg"
        footer={
          viewing && (
            <>
              <Button variant="dangerGhost" className="mr-auto" onClick={() => askDelete(viewing)} disabled={pending}>
                <Trash2 className="size-4" />
                Delete
              </Button>
              <Button onClick={() => copyUrl(viewing)}>
                <Copy className="size-4" />
                Copy URL
              </Button>
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid place-items-center overflow-hidden rounded-lg bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:20px_20px]">
              {/* eslint-disable-next-line @next/next/no-img-element -- full-size preview of our own already-optimised file */}
              <img src={viewing.url} alt={viewing.altText ?? ""} className="max-h-[50vh] w-auto object-contain" />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-zinc-500">Dimensions</dt>
                <dd className="font-semibold text-zinc-800">
                  {viewing.width}×{viewing.height}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Size</dt>
                <dd className="font-semibold text-zinc-800">{formatBytes(viewing.sizeBytes)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Type</dt>
                <dd className="font-semibold text-zinc-800">WebP</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Uploaded</dt>
                <dd className="font-semibold text-zinc-800">
                  <LocalTime iso={viewing.createdAt} mode="date" />
                </dd>
              </div>
            </dl>
            <Field label="URL" htmlFor="media-url">
              <Input id="media-url" readOnly value={viewing.url} onFocus={(event) => event.target.select()} className="font-mono text-xs" />
            </Field>
            <Field label="Alt text" htmlFor="media-alt" hint="Describes the image for screen readers and search engines.">
              <div className="flex gap-2">
                <Input id="media-alt" value={alt} maxLength={300} onChange={(event) => setAlt(event.target.value)} />
                <Button onClick={saveAlt} disabled={pending || alt === (viewing.altText ?? "")}>
                  Save
                </Button>
              </div>
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={forceDelete}
        pending={pending}
        title="This image is in use"
        confirmLabel="Delete anyway"
      >
        {deleting && (
          <>
            <strong className="text-zinc-900">{deleting.item.filename}</strong> is used in {deleting.inUse}{" "}
            {deleting.inUse === 1 ? "place" : "places"}. Deleting it will leave a broken image there.
          </>
        )}
      </ConfirmDialog>
    </>
  );
}
