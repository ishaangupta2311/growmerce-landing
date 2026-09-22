import { tryDb } from "@/lib/db";

export type ContactSubmission = {
  name: string;
  email: string;
  store: string | null;
  topic: string;
  message: string;
};

export type ContactOutcome = "inserted" | "unavailable";

/** Stores one contact request without putting its contents into logs. */
export async function recordContactSubmission(
  entry: ContactSubmission,
): Promise<ContactOutcome> {
  const name = entry.name.trim().slice(0, 120);
  const email = entry.email.trim().toLowerCase();
  const store = entry.store?.trim().toLowerCase() || null;
  const topic = entry.topic.trim().slice(0, 80);
  const message = entry.message.trim().slice(0, 5000);

  return tryDb(
    "contact insert",
    async (sql) => {
      const rows = await sql`
        insert into marketing.contact_submission
          (name, email, store, topic, message)
        values
          (${name}, ${email}, ${store}, ${topic}, ${message})
        returning id
      `;
      return rows.length > 0 ? "inserted" : "unavailable";
    },
    "unavailable",
  );
}
