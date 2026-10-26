import { tryDb } from "@/lib/db";

export type ContactSubmission = {
  name: string;
  company: string;
  email: string;
  phone: string;
  topic: string;
  /** The optional "any growth challenge" answer. */
  message: string | null;
};

export type ContactOutcome = "inserted" | "unavailable";

/** Stores one contact request without putting its contents into logs. */
export async function recordContactSubmission(
  entry: ContactSubmission,
): Promise<ContactOutcome> {
  const name = entry.name.trim().slice(0, 120);
  const company = entry.company.trim().slice(0, 160);
  const email = entry.email.trim().toLowerCase();
  const phone = entry.phone.trim().slice(0, 24);
  const topic = entry.topic.trim().slice(0, 80);
  const message = entry.message?.trim().slice(0, 5000) || null;

  return tryDb(
    "contact insert",
    async (sql) => {
      const rows = await sql`
        insert into marketing.contact_submission
          (name, company, email, phone, topic, message)
        values
          (${name}, ${company}, ${email}, ${phone}, ${topic}, ${message})
        returning id
      `;
      return rows.length > 0 ? "inserted" : "unavailable";
    },
    "unavailable",
  );
}
