"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImageIcon, LoaderCircle, Search, Upload } from "lucide-react";
import { listMediaAction } from "@/app/admin/_actions/media";
import { MEDIA_ACCEPT, type MediaItem } from "@/lib/blog/types";
import { clsx } from "@/lib/clsx";
import { uploadFiles } from "./media-upload";
import { Modal, useToast } from "./overlay";
import Thumb from "./Thumb";
import { Button, Input } from "./ui";

type Listing = { key: string; items: MediaItem[]; page: number; pageCount: number };

/**
 * Pick an image from the library, or upload one and pick it in the same
 * step. Used by the editor's image button and every image field.
 */
export default function MediaPicker({
  open,
  onClose,
  onSelect,
  title = "Choose an image",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  title?: string;
}) {
  const notify = useToast();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const key = `${open}:${query}`;
  const loading = open && listing?.key !== key;

  /* Debounce the search box into the query that actually loads. */
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const result = await listMediaAction(query, 1);
      if (cancelled) return;
      if (result.ok) setListing({ key, ...result.data });
      else {
        setListing({ key, items: [], page: 1, pageCount: 1 });
        notify(result.error, "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, query, key, notify]);

  async function loadMore() {
    if (!listing) return;
    setLoadingMore(true);
    const result = await listMediaAction(query, listing.page + 1);
    setLoadingMore(false);
    if (result.ok) {
      setListing({ key, items: [...listing.items, ...result.data.items], page: result.data.page, pageCount: result.data.pageCount });
    }
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setUploading(`Uploading 0 of ${list.length}…`);
    const report = await uploadFiles(list, (done, total) => setUploading(`Uploading ${done} of ${total}…`));
    setUploading(null);
    if (fileInput.current) fileInput.current.value = "";

    report.errors.forEach((message) => notify(message, "error"));
    if (report.uploaded.length > 0) {
      setListing((current) =>
        current ? { ...current, items: [...report.uploaded.reverse(), ...current.items] } : current,
      );
      setSelected(report.uploaded[0]);
    }
  }

  function close() {
    setSelected(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      size="xl"
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onSelect(selected);
              close();
            }}
          >
            <Check className="size-4" />
            Use image
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search images…"
            aria-label="Search images"
            className="pl-9"
          />
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={MEDIA_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => upload(event.target.files)}
        />
        <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={Boolean(uploading)}>
          {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ?? "Upload"}
        </Button>
      </div>

      {loading ? (
        <div className="grid min-h-60 place-items-center text-zinc-400">
          <LoaderCircle className="size-6 animate-spin" />
        </div>
      ) : !listing || listing.items.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center text-center">
          <div className="mb-3 grid size-11 place-items-center rounded-full bg-zinc-100 text-zinc-500">
            <ImageIcon className="size-5" />
          </div>
          <p className="text-sm font-bold text-zinc-900">{query ? "No images match" : "The library is empty"}</p>
          <p className="mt-1 text-sm text-zinc-500">Upload an image to use it here.</p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {listing.items.map((item) => {
              const active = selected?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    onDoubleClick={() => {
                      onSelect(item);
                      close();
                    }}
                    aria-pressed={active}
                    className={clsx(
                      "group relative block w-full overflow-hidden rounded-lg text-left ring-2 transition-shadow",
                      active ? "ring-brand" : "ring-transparent hover:ring-zinc-300",
                    )}
                  >
                    <Thumb src={item.url} alt={item.altText ?? ""} className="aspect-square w-full rounded-lg" sizes="160px" />
                    {active && (
                      <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-brand text-white">
                        <Check className="size-3.5" />
                      </span>
                    )}
                    <span className="mt-1 block truncate text-xs text-zinc-500">{item.filename}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {listing.page < listing.pageCount && (
            <div className="mt-4 text-center">
              <Button onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <LoaderCircle className="size-4 animate-spin" />}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
