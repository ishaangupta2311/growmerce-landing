import { clientKey, overBudget } from "@/lib/preview/rate-limit";
import { normaliseStoreInput } from "@/lib/store-domain";
import { recordContactSubmission } from "@/lib/contact";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOPICS = new Set([
  "Growsearch or product questions",
  "Request a demo",
  "Existing customer support",
  "Partnership inquiry",
  "Something else",
]);

const BUDGET = {
  limit: process.env.NODE_ENV === "development" ? 100 : 12,
  windowMs: 10 * 60 * 1000,
};

export async function POST(request: Request) {
  if (overBudget("contact", clientKey(request), BUDGET)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { name, email, store, topic, message, website } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    store?: unknown;
    topic?: unknown;
    message?: unknown;
    website?: unknown;
  };

  /* Quietly accept the honeypot so automated senders do not learn whether
     their request was filtered. */
  if (typeof website === "string" && website.trim()) {
    return Response.json({ ok: true });
  }

  if (typeof name !== "string" || !name.trim() || name.length > 120) {
    return Response.json({ ok: false, error: "invalid_name" }, { status: 400 });
  }
  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (typeof topic !== "string" || !TOPICS.has(topic)) {
    return Response.json({ ok: false, error: "invalid_topic" }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim() || message.length > 5000) {
    return Response.json({ ok: false, error: "invalid_message" }, { status: 400 });
  }

  let storeHost: string | null = null;
  if (store !== undefined && store !== null && store !== "") {
    if (typeof store !== "string") {
      return Response.json({ ok: false, error: "invalid_store" }, { status: 400 });
    }
    storeHost = normaliseStoreInput(store);
    if (!storeHost) {
      return Response.json({ ok: false, error: "invalid_store" }, { status: 400 });
    }
  }

  const outcome = await recordContactSubmission({
    name,
    email,
    store: storeHost,
    topic,
    message,
  });

  if (outcome !== "inserted") {
    return Response.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true });
}
