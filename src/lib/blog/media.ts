import "server-only";

import sharp, { type OutputInfo } from "sharp";
import { slugify } from "./slug";
import { requireSql } from "./sql";
import { MEDIA_MAX_UPLOAD_BYTES, type MediaItem } from "./types";

/**
 * The media library: uploads are decoded, re-encoded and stored in
 * `blog.media` (see migrations/0006_blog.sql for why the bytes live in
 * Postgres), then served by src/app/uploads/[id]/[name]/route.ts.
 *
 * Every upload is re-encoded, never stored as sent. That is the optimisation
 * — WebP, capped at 2400px, EXIF orientation applied — and it is also the
 * safety: whatever arrived is decoded as an image and a fresh file is written,
 * so a file that only claims to be an image, or smuggles script or GPS
 * metadata inside one, does not survive the trip.
 */

const MAX_DIMENSION = 2400;
/** Decompression-bomb guard: refuse anything over ~40 megapixels before decoding it. */
const MAX_INPUT_PIXELS = 40_000_000;
const READABLE = new Set(["jpeg", "png", "webp", "gif", "avif", "heif"]);

export class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaError";
  }
}

export function mediaUrl(id: string, filename: string): string {
  return `/uploads/${id}/${filename}`;
}

type MediaRow = {
  id: string;
  filename: string;
  mime_type: string;
  width: number;
  height: number;
  size_bytes: number;
  alt_text: string | null;
  created_at: Date;
};

function toItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    url: mediaUrl(row.id, row.filename),
    filename: row.filename,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    sizeBytes: row.size_bytes,
    altText: row.alt_text,
    createdAt: row.created_at.toISOString(),
  };
}

export async function storeUpload(file: File, adminId: string): Promise<MediaItem> {
  if (file.size === 0) throw new MediaError("That file is empty.");
  if (file.size > MEDIA_MAX_UPLOAD_BYTES) throw new MediaError("Images must be 4 MB or smaller.");

  const input = Buffer.from(await file.arrayBuffer());

  let format: string | undefined;
  let pages = 1;
  try {
    const meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
    format = meta.format;
    pages = meta.pages ?? 1;
  } catch {
    throw new MediaError("That file is not an image we can read.");
  }
  if (!format || !READABLE.has(format)) {
    throw new MediaError("Upload a JPEG, PNG, WebP, GIF or AVIF image.");
  }

  const animated = pages > 1 && (format === "gif" || format === "webp");

  let output: { data: Buffer; info: OutputInfo };
  try {
    let pipeline = sharp(input, { animated, limitInputPixels: MAX_INPUT_PIXELS });
    /* Bake EXIF orientation into the pixels before the metadata is dropped,
       or portrait phone photos come out sideways. */
    if (!animated) pipeline = pipeline.rotate();
    output = await pipeline
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new MediaError("That image could not be processed. Try exporting it again as JPEG or PNG.");
  }

  const height = animated ? (output.info.pageHeight ?? output.info.height) : output.info.height;
  const stem = slugify(file.name.replace(/\.[^.]*$/, "")).slice(0, 80) || "image";
  const filename = `${stem}.webp`;

  const sql = requireSql();
  const [row] = await sql<MediaRow[]>`
    insert into blog.media (filename, mime_type, width, height, size_bytes, data, uploaded_by)
    values (${filename}, 'image/webp', ${output.info.width}, ${height}, ${output.data.length}, ${output.data}, ${adminId})
    returning id, filename, mime_type, width, height, size_bytes, alt_text, created_at
  `;
  return toItem(row);
}

export async function listMedia(q: string, page: number, pageSize: number) {
  const sql = requireSql();
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const where = q ? sql`where filename ilike ${pattern} or alt_text ilike ${pattern}` : sql``;

  /* Never select `data` here — a page of thumbnails would pull every image
     through the database connection. The window count brings the total
     along in the same trip. */
  const fetchPage = (current: number) => sql<(MediaRow & { total: number })[]>`
    select id, filename, mime_type, width, height, size_bytes, alt_text, created_at,
           count(*) over ()::int as total
    from blog.media
    ${where}
    order by created_at desc
    limit ${pageSize} offset ${(current - 1) * pageSize}
  `;

  let current = Math.max(1, page);
  let rows = await fetchPage(current);
  let total = rows[0]?.total ?? 0;
  if (rows.length === 0 && current > 1) {
    const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from blog.media ${where}`;
    total = count;
    current = Math.max(1, Math.ceil(total / pageSize));
    rows = total > 0 ? await fetchPage(current) : rows;
  }
  return { items: rows.map(toItem), total, page: current, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function updateMediaAlt(id: string, altText: string | null): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`update blog.media set alt_text = ${altText} where id = ${id} returning id`;
  return rows.length > 0;
}

/** How many posts and authors still point at an image. */
export async function mediaUsage(id: string): Promise<number> {
  const sql = requireSql();
  const pattern = `%/uploads/${id}/%`;
  const [row] = await sql<{ posts: number; authors: number }[]>`
    select
      (select count(*)::int from blog.post
        where featured_image like ${pattern} or og_image like ${pattern} or content like ${pattern}) as posts,
      (select count(*)::int from blog.author where avatar_url like ${pattern}) as authors
  `;
  return row.posts + row.authors;
}

export async function deleteMedia(id: string): Promise<boolean> {
  const sql = requireSql();
  const rows = await sql`delete from blog.media where id = ${id} returning id`;
  return rows.length > 0;
}
