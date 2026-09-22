/**
 * The one place an install-waitlist signup is written down.
 *
 * The "Install on Shopify" buttons cannot install anything yet — the listing
 * is still in Shopify's review queue — so they take a name, an address and a
 * storefront instead, and this is where those land. See
 * `migrations/0004_waitlist.sql` for why they do not go in `marketing.lead`:
 * a row here is an email we owe someone on launch day, and `notified_at` is
 * the column that remembers it.
 *
 * The dedup rule is the same one the owner set for leads, and it is enforced
 * by the table rather than by this file — `marketing.waitlist` has
 * `unique (domain, email)` and the insert is `on conflict do nothing`:
 *
 *   ("shop.example", a@x)   inserted
 *   ("shop.example", a@x)   no-op      same merchant, pressed it twice
 *   ("shop.example", b@x)   appended   a colleague at the same shop
 *   ("other.example", a@x)  appended   the same merchant's second shop
 *
 * A repeat is a true no-op — `name` and `source` stay whatever the first
 * submission said. Bumping them would mean a second click could quietly
 * rewrite the row we are going to mail, for no gain.
 *
 * Every call goes through `tryDb`, which is the site's standing rule for the
 * database: a write that fails is reported as `unavailable` and the caller
 * carries on. Nothing here throws and nothing here logs — the address belongs
 * in the `email` column and in no log line, so the caller gets an outcome word
 * back and does its own logging with a non-reversible reference.
 */

import { tryDb } from "@/lib/db";

export type WaitlistInput = {
  /** The merchant's address as typed. Normalised here, not by the caller. */
  email: string;
  /** The normalised storefront host. Required — see the migration. */
  domain: string;
  /** Optional; the field is the last one in the form and may be left blank. */
  name: string | null;
  /** Which CTA sent it, so the launch email can be told where they came from. */
  source: string;
};

/**
 * What happened to the row. `duplicate` is the good kind of nothing — the pair
 * was already on the list. `unavailable` is the database's fault, never the
 * merchant's, and the caller must treat it as success from their point of view.
 */
export type WaitlistOutcome = "inserted" | "duplicate" | "unavailable";

/**
 * Puts one (storefront, email) pair on the list, once.
 *
 * The address is lower-cased and trimmed here because the unique constraint
 * compares bytes: `A@x.com` and `a@x.com` are one merchant to us and two rows
 * to Postgres. Keeping that in the store, rather than trusting each caller to
 * remember, is what makes the "colleague vs. same person" distinction above
 * reliable — and what stops us mailing the same person twice on launch day.
 */
export async function recordWaitlistSignup(
  entry: WaitlistInput,
): Promise<WaitlistOutcome> {
  const email = entry.email.trim().toLowerCase();
  const domain = entry.domain.trim().toLowerCase();
  const name = entry.name?.trim().slice(0, 120) || null;
  const source = entry.source.trim().slice(0, 64) || "unknown";

  return tryDb(
    "waitlist insert",
    async (sql) => {
      /* `returning id` is how we learn whether the row landed: on a conflict,
         DO NOTHING returns no row and the result is empty. The column named is
         deliberately the surrogate key, so nothing from this result could ever
         carry an address into a log by accident. */
      const rows = await sql`
        insert into marketing.waitlist (domain, email, name, source)
        values (${domain}, ${email}, ${name}, ${source})
        on conflict (domain, email) do nothing
        returning id
      `;
      return rows.length > 0 ? "inserted" : "duplicate";
    },
    "unavailable",
  );
}
