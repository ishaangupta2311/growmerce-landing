import { uploadMediaAction } from "@/app/admin/_actions/media";
import { MEDIA_ACCEPT, MEDIA_MAX_UPLOAD_BYTES, type MediaItem } from "@/lib/blog/types";

const ACCEPTED = new Set(MEDIA_ACCEPT.split(","));

export type UploadReport = { uploaded: MediaItem[]; errors: string[] };

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
