import { db } from "@/lib/db";

/**
 * Serves media-library images from `blog.media`.
 *
 * An id's bytes never change (a new upload gets a new id), so responses are
 * cacheable forever: after the first request the CDN and the browser answer,
 * and the database is not asked again. The trailing filename is cosmetic —
 * it gives the URL a readable name — and only the id is looked up.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function GET(_request: Request, ctx: RouteContext<"/uploads/[id]/[name]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return notFound();

  const sql = db();
  if (!sql) return notFound();

  let row: { data: Buffer; mime_type: string } | undefined;
  try {
    [row] = await sql<{ data: Buffer; mime_type: string }[]>`
      select data, mime_type from blog.media where id = ${id}
    `;
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    console.warn(`[uploads] read failed — ${why.slice(0, 200)}`);
    return new Response("Temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "5" } });
  }
  if (!row) return notFound();

  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime_type,
      "Content-Length": String(row.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      /* Only ever an image: never sniffed as anything else, never able to run
         script even if opened directly. */
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}

function notFound() {
  /* Short cache: a missing id stays missing, but not forever in case of a
     race with an upload that is still committing. */
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
}
