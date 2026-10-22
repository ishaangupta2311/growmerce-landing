/**
 * Where the Growsearch app's `npm run announce` (smart-search repo) hands us
 * release announcements: `POST /api/announcements/<operation>`.
 *
 *   status  {}                    → where to start, and whether one is pending
 *   draft   the post and email    → the one pending announcement, created or replaced
 *   skip    the notes and why     → those notes need no announcement
 *
 * Server-to-server only, authenticated by ANNOUNCE_SECRET (see
 * src/lib/announcements/signature.ts). Nothing here publishes or sends: a
 * draft waits in /admin/announcements until somebody approves it. The full
 * contract is in docs/release-announcements.md.
 *
 * POST handlers are never cached by Next; the `no-store` header says so to
 * anything in between as well.
 */

import { z } from "zod";

import {
  describeIssue,
  draftSchema,
  skipSchema,
  statusSchema,
} from "@/lib/announcements/contract";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifyAnnouncement } from "@/lib/announcements/signature";
import {
  ADMIN_PATH,
  announcementState,
  InvalidDraftError,
  recordSkip,
  saveDraft,
} from "@/lib/announcements/store";
import { SITE_ORIGIN } from "@/lib/site-urls";

/** A post and an email, as JSON. Anything larger is a mistake. */
const MAX_BODY_BYTES = 256 * 1024;

const OPERATIONS = ["status", "draft", "skip"] as const;
type Operation = (typeof OPERATIONS)[number];

const HEADERS = { "cache-control": "no-store" };

function reply(body: object, status = 200): Response {
  return Response.json(status < 400 ? { ok: true, ...body } : { ok: false, ...body }, { status, headers: HEADERS });
}

/**
 * This deployment's origin, for `adminUrl`: a preview deployment that drafts
 * an announcement should link to its own admin. The request is signed, so the
 * host is the app's own choice of where to call.
 */
function origin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}` : SITE_ORIGIN;
}

export async function POST(request: Request, { params }: { params: Promise<{ operation: string }> }) {
  const { operation } = await params;
  const path = `/api/announcements/${operation}`;

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return reply({ error: "body_too_large" }, 413);

  /* The body as text, once, and the signature checked against exactly these
     bytes: re-serialising a parse would make the check depend on two
     runtimes agreeing on key order. */
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return reply({ error: "body_too_large" }, 413);

  const signature = verifyAnnouncement({
    secret: process.env.ANNOUNCE_SECRET,
    timestamp: request.headers.get(TIMESTAMP_HEADER),
    signature: request.headers.get(SIGNATURE_HEADER),
    path,
    rawBody: raw,
  });
  if (!signature.ok) {
    /* The reason goes to the log, not the caller: telling an unauthenticated
       caller whether the clock or the key was wrong helps them guess. */
    console.warn(`[announcements] rejected a ${operation.replace(/[^\w-]/g, "?").slice(0, 40)} request — ${signature.reason}`);
    if (signature.reason === "not_configured") return reply({ error: "not_configured" }, 503);
    return reply({ error: "unauthorized" }, 401);
  }

  if (!(OPERATIONS as readonly string[]).includes(operation)) return reply({ error: "unknown_operation" }, 404);

  let body: unknown;
  try {
    body = raw.trim() === "" ? {} : JSON.parse(raw);
  } catch {
    return reply({ error: "invalid_json" }, 400);
  }

  try {
    return await handle(operation as Operation, body, request);
  } catch (err) {
    if (err instanceof InvalidDraftError) return reply({ error: err.message }, 400);
    /* Ours: a database we could not reach, a constraint we did not expect.
       Worth the app retrying. Message only — postgres.js errors carry their
       parameters, and those are whole blog posts. */
    const why = err instanceof Error ? err.message : String(err);
    console.error(`[announcements] ${operation} failed — ${why.slice(0, 300)}`);
    return reply({ error: "internal_error" }, 500);
  }
}

async function handle(operation: Operation, body: unknown, request: Request): Promise<Response> {
  const adminUrl = `${origin(request)}${ADMIN_PATH}`;

  if (operation === "status") {
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) return invalid(parsed.error);
    const state = await announcementState();
    return reply({ ...state, pending: state.pending ? { ...state.pending, adminUrl } : null });
  }

  if (operation === "draft") {
    const parsed = draftSchema.safeParse(body);
    if (!parsed.success) return invalid(parsed.error);
    const saved = await saveDraft(parsed.data);
    console.info(
      `[announcements] ${saved.replaced ? "replaced the pending draft" : "new draft"} for ${parsed.data.releaseRef.slice(0, 80)}`,
    );
    return reply({ id: saved.id, postId: saved.postId, adminUrl });
  }

  const parsed = skipSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);
  const outcome = await recordSkip(parsed.data);
  if (!outcome.ok) {
    return reply(
      { error: "An announcement is pending approval. Approve or discard it first.", pendingId: outcome.pendingId, adminUrl },
      409,
    );
  }
  return reply({ id: outcome.id });
}

function invalid(error: z.ZodError): Response {
  return reply({ error: describeIssue(error) }, 400);
}
