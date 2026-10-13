import { uploadMediaAction } from "@/app/admin/_actions/media";
import { MEDIA_ACCEPT, MEDIA_MAX_UPLOAD_BYTES, type MediaItem } from "@/lib/blog/types";

const ACCEPTED = new Set(MEDIA_ACCEPT.split(","));

export type UploadReport = { uploaded: MediaItem[]; errors: string[] };

/**
 * The images on a clipboard or a drag, in order.
 *
 * A copied image arrives as a file even when it has no name — a screenshot
 * pasted straight from the system clipboard is `image/png` with an empty
 * name — so the name is only used for the stored filename, never to decide
 * whether this is an image.
 */
export function imageFilesFrom(data: DataTransfer | null | undefined): File[] {
  if (!data) return [];
  const files = Array.from(data.files ?? []).filter((file) => file.type.startsWith("image/"));
  if (files.length > 0) return files;

  /* Safari and some apps expose the image through `items` only. */
  return Array.from(data.items ?? [])
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

/**
 * A `data:` image URL as a File, so it can go through the same upload as any
 * other image. Pasting from Word, Google Docs or a mail client often embeds
 * images this way rather than attaching them to the clipboard as files.
 */
export async function dataUriToFile(uri: string, name: string): Promise<File | null> {
  try {
    const blob = await (await fetch(uri)).blob();
    if (!blob.type.startsWith("image/")) return null;
    const extension = blob.type.split("/")[1]?.split("+")[0] ?? "png";
    return new File([blob], `${name}.${extension}`, { type: blob.type });
  } catch {
    return null;
  }
}

/**
 * Uploads files one request at a time. Sequential on purpose: each request
 * stays under the platform's body limit, and one bad file costs only itself.
 * The size and type checks here are for a fast answer — the server decodes
 * every file and is the check that counts.
 */
export async function uploadFiles(files: File[], onEach?: (done: number, total: number) => void): Promise<UploadReport> {
  const report: UploadReport = { uploaded: [], errors: [] };
  let done = 0;

  for (const file of files) {
    if (!ACCEPTED.has(file.type)) {
      report.errors.push(`${file.name}: use a JPEG, PNG, WebP, GIF or AVIF image.`);
    } else if (file.size > MEDIA_MAX_UPLOAD_BYTES) {
      report.errors.push(`${file.name}: images must be 4 MB or smaller.`);
    } else {
      const form = new FormData();
      form.set("file", file);
      try {
        const result = await uploadMediaAction(form);
        if (result.ok) report.uploaded.push(result.data);
        else report.errors.push(`${file.name}: ${result.error}`);
      } catch {
        report.errors.push(`${file.name}: the upload failed. Check your connection and try again.`);
      }
    }
    onEach?.(++done, files.length);
  }
  return report;
}
