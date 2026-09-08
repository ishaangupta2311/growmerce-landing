/**
 * The one place a lead is written down.
 *
 * Until this existed the trial form validated an address and then logged a
 * reference to it and threw it away, so every lead taken before it went live is
 * gone. This is the first time the business keeps one, and the rule it keeps
 * them by came from the owner in one sentence: "if a different email is entered
 * for the same domain than the one we have in our db, we'll append that email".
 * So the unit is the *pair* (storefront, address), not the storefront and not
 * the address:
 *
 *   ("shop.example", a@x)   inserted
 *   ("shop.example", a@x)   no-op      same person, back again
 *   ("shop.example", b@x)   appended   a colleague at the same shop
 *   ("other.example", a@x)  appended   the same person, a second shop
 *   (null, c@x)             inserted   the "See demo" gate sends no store
 *   (null, c@x)             no-op
 *
 * The dedup is enforced by the table, not by this file. `marketing.lead` has
 * `unique nulls not distinct (domain, email)`, and the insert is `on conflict
 * do nothing`, so two requests racing on the same pair cannot both land and
 * there is no read-then-write to get wrong. NULLS NOT DISTINCT is what makes
 * the last two lines above true: under Postgres' default, a NULL domain is
 * never equal to another NULL domain, so every repeat through the gate would
 * have been a fresh row.
 *
 * A repeat is a true no-op: nothing is bumped, `source` stays whatever the
 * first submission said. The schema has no `last_seen` to update, and until it
 * does, the honest thing is to not pretend to.
 *
 * Every call goes through `tryDb`, which is the site's rule for the database:
 * a write that fails is reported as `unavailable` and the caller carries on.
 * Nothing here throws, and nothing here logs — the address belongs in the
 * `email` column and in no log line, so the caller gets an outcome word back
 * and does its own logging with a non-reversible reference.
 */

import { tryDb } from "@/lib/db";

export type LeadInput = {
  /** The visitor's address as typed. Normalised here, not by the caller. */
  email: string;
  /**
   * The normalised storefront host, or null when the form asked for none
   * (the "See demo" gate). Null is a real value with its own dedup slot, not
   * an absence to be filled in later.
   */
  domain: string | null;
  /** Which CTA sent it, so the pages can be told apart in the table. */
  source: string;
};

/**
 * What happened to the row. `duplicate` is the good kind of nothing — the
 * pair was already there. `unavailable` is the database's fault, never the
 * visitor's, and the caller must treat it as success from their point of view.
 */
export type LeadOutcome = "inserted" | "duplicate" | "unavailable";

/**
 * Persists one (storefront, email) pair, once.
 *
 * The address is lower-cased and trimmed here because the unique constraint
 * compares bytes: `A@x.com` and `a@x.com` are one person to us and two rows to
 * Postgres. Keeping that in the store, rather than trusting each caller to
 * remember, is what makes the "colleague vs. same person" distinction in the
 * table reliable.
 */
export async function recordLead(lead: LeadInput): Promise<LeadOutcome> {
  const email = lead.email.trim().toLowerCase();
  const domain = lead.domain ? lead.domain.trim().toLowerCase() : null;
  const source = lead.source.trim().slice(0, 64) || "unknown";

  return tryDb(
    "lead insert",
    async (sql) => {
      /* `returning id` is how we learn whether the row landed: on a conflict,
         DO NOTHING returns no row and the result is empty. The column named
         is deliberately the surrogate key, so nothing from this result could
         ever carry an address into a log by accident. */
      const rows = await sql`
        insert into marketing.lead (domain, email, source)
        values (${domain}, ${email}, ${source})
        on conflict (domain, email) do nothing
        returning id
      `;
      return rows.length > 0 ? "inserted" : "duplicate";
    },
    "unavailable",
  );
}
