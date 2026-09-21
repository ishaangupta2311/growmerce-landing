/**
 * Creates an admin account, or resets the password of an existing one.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' npm run admin:create
 *
 * Values come from the environment (or .env.local). The password is hashed
 * here and only the hash is stored. Resetting a password also signs that
 * account out everywhere, because a reset usually means the old one leaked.
 *
 * Also gives the account an author profile if it has none, so the first post
 * has a byline to pick.
 */

import postgres from "postgres";
import { hashPassword, passwordProblem } from "../src/lib/auth/password";
import { ensureAuthorProfile } from "../src/lib/blog/author-profile";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* No .env.local — rely on the real environment. */
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const url = process.env.DATABASE_URL?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
const password = process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME?.trim() || email.split("@")[0] || "Admin";

if (!url) fail("DATABASE_URL is not set.");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail("ADMIN_EMAIL is missing or not an email address.");
const problem = passwordProblem(password);
if (problem) fail(`ADMIN_PASSWORD is not usable: ${problem}`);
if (password === "CHANGE_THIS_PASSWORD") fail("ADMIN_PASSWORD is still the placeholder. Choose a real one.");

async function main(databaseUrl: string) {
  const sql = postgres(databaseUrl, { prepare: false, max: 1, onnotice: () => {} });
  try {
    const [user] = await sql<{ id: string; inserted: boolean }[]>`
      insert into blog.admin_user (email, name, password_hash)
      values (${email}, ${name}, ${await hashPassword(password)})
      on conflict (email) do update
        set password_hash = excluded.password_hash,
            updated_at = now()
      returning id, (xmax = 0) as inserted
    `;

    if (!user.inserted) {
      await sql`delete from blog.session where admin_user_id = ${user.id}`;
    }
    await ensureAuthorProfile(sql, user.id, name);

    console.log(
      user.inserted
        ? `Created admin ${email}.`
        : `Reset the password for ${email} and signed that account out everywhere.`,
    );
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    console.error(/relation "blog\./.test(why) ? `${why}\nRun \`npm run db:migrate\` first.` : why);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void main(url);
