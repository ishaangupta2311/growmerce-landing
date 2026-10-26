import { clientKey, overBudget } from "@/lib/preview/rate-limit";
import { recordContactSubmission } from "@/lib/contact";
import { isPhone } from "@/lib/phone";

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

  const { name, company, email, phone, topic, message, website } = (body ?? {}) as {
    name?: unknown;
    company?: unknown;
    email?: unknown;
    phone?: unknown;
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
  if (typeof company !== "string" || !company.trim() || company.length > 160) {
    return Response.json({ ok: false, error: "invalid_company" }, { status: 400 });
  }
  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (typeof phone !== "string" || !isPhone(phone)) {
    return Response.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  if (typeof topic !== "string" || !TOPICS.has(topic)) {
    return Response.json({ ok: false, error: "invalid_topic" }, { status: 400 });
  }
  if (
    message !== undefined &&
    message !== null &&
    (typeof message !== "string" || message.length > 5000)
  ) {
    return Response.json({ ok: false, error: "invalid_message" }, { status: 400 });
  }

  const outcome = await recordContactSubmission({
    name,
    company,
    email,
    phone,
    topic,
    message: typeof message === "string" ? message : null,
  });

  if (outcome !== "inserted") {
    return Response.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true });
}
