/**
 * Where the Growsearch app tells us a store entered an affiliate code, went
 * live, paid, or churned.
 *
 * Server-to-server only: no browser calls this, and it is authenticated by a
 * shared secret rather than by a session. See `src/lib/affiliate/signature.ts`
 * for why it fails closed and `src/lib/affiliate/ingest.ts` for what each event
 * means once it is through the door.
 *
 * The response shape is chosen for a sender with a retry queue. A 2xx means
 * "stop retrying": that covers events we applied, events we deliberately
 * ignored (an unknown code is not going to become known by asking again), and
 * events we had already seen. Only a 5xx — a database we could not reach —
 * asks for another attempt. A 4xx means the payload is wrong and retrying it
 * will not help either, which is why the per-event errors come back listed
 * rather than as a single failure for the batch.
 */

import {
  ingest,
  InvalidEventError,
  parseEvent,
  clearMaturedCommissions,
  type IngestOutcome,
} from "@/lib/affiliate/ingest";
import { verifySignature } from "@/lib/affiliate/signature";

/** One request may carry a batch; this caps how much work it can ask for. */
const MAX_EVENTS = 50;

/** A body larger than this is not a batch of events, it is a mistake. */
const MAX_BODY_BYTES = 256 * 1024;

/**
 * How often this process bothers to sweep matured commissions.
 *
 * Clearing the refund window is one indexed UPDATE, but running it on every
 * event in a busy hour is a write nobody asked for. Hourly per instance is
 * plenty for a thirty-day window, and it means an active program needs no cron
 * at all. A *quiet* program does — a partner whose last referral churned in
 * January must still see their December commissions clear — which is what the
 * empty POST documented in `docs/affiliate.md` is for.
 */
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;
let lastSweep = 0;

async function sweep(force: boolean): Promise<number | null> {
  if (!force && Date.now() - lastSweep < SWEEP_INTERVAL_MS) return null;
  lastSweep = Date.now();
  return clearMaturedCommissions();
}

type EventResult =
  | { id: string; status: IngestOutcome["status"]; detail: string }
  | { id: string | null; status: "invalid"; detail: string };

export async function POST(request: Request) {
  /* Read the body as text, once, and verify the signature against exactly
     these bytes. Parsing first and re-serialising to check the HMAC would make
     the check depend on two runtimes agreeing on key order. */
  const raw = await request.text();

  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ ok: false, error: "body_too_large" }, { status: 413 });
  }

  const signature = verifySignature(request, raw);
  if (!signature.ok) {
    /* The reason is logged and not returned. An unauthenticated caller learning
       whether they got the timestamp wrong or the key wrong is being helped to
       guess; an operator reading the logs needs to know which it was. */
    console.warn(`[affiliate] rejected an event batch — ${signature.reason}`);
    const status = signature.reason === "not_configured" ? 503 : 401;
    return Response.json({ ok: false, error: "unauthorized" }, { status });
  }

  let body: unknown;
  try {
    body = raw.trim() === "" ? {} : JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const list = eventsIn(body);
  if (list === null) {
    return Response.json(
      { ok: false, error: "expected an event object or { events: [...] }" },
      { status: 400 },
    );
  }
  if (list.length > MAX_EVENTS) {
    return Response.json({ ok: false, error: "too_many_events" }, { status: 400 });
  }

  const results: EventResult[] = [];

  /* Sequentially, not in parallel. Two events for the same store in one batch —
     `referral.linked` immediately followed by `charge.succeeded`, which is
     exactly what a first install produces — must be applied in the order they
     were sent, and each takes a row lock the other would wait on anyway. */
  for (const item of list) {
    try {
      const event = parseEvent(item);
      const outcome = await ingest(event);
      results.push({ id: event.id, status: outcome.status, detail: outcome.detail });
    } catch (err) {
      if (err instanceof InvalidEventError) {
        const id = typeof (item as { id?: unknown })?.id === "string" ? (item as { id: string }).id : null;
        results.push({ id, status: "invalid", detail: err.message });
        continue;
      }
      /* Anything else is ours — an unreachable database, a constraint we did
         not anticipate. The sender should try again, so the whole request
         fails rather than reporting a partial success it would not retry. */
      const why = err instanceof Error ? err.message : String(err);
      console.error(`[affiliate] ingest failed — ${why.slice(0, 300)}`);
      return Response.json({ ok: false, error: "ingest_failed" }, { status: 500 });
    }
  }

  /* An empty body is the cron's way in: it authenticates, sweeps, and reports.
     Giving it its own route would mean a second secret to rotate. */
  const cleared = await sweep(list.length === 0);
  if (cleared !== null && cleared > 0) {
    console.info(`[affiliate] ${cleared} commission(s) cleared the refund window`);
  }

  const invalid = results.filter((r) => r.status === "invalid").length;
  return Response.json({ ok: invalid === 0, results, cleared }, { status: invalid > 0 ? 400 : 200 });
}

/** Accepts a bare event, a `{ events: [...] }` batch, or an empty sweep ping. */
function eventsIn(body: unknown): unknown[] | null {
  if (typeof body !== "object" || body === null) return null;

  const wrapped = (body as { events?: unknown }).events;
  if (Array.isArray(wrapped)) return wrapped;
  if (wrapped !== undefined) return null;

  /* `{}` is the sweep ping; anything else with keys is meant to be one event. */
  return Object.keys(body).length === 0 ? [] : [body];
}
