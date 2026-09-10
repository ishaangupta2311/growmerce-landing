/**
 * The two values every Supabase client needs, and one honest answer about
 * whether they are there.
 *
 * Both are public by design — the anon key ships inside the browser bundle and
 * is meant to. What stops it being a skeleton key is row-level security, which
 * the affiliate tables have enabled with no policies (see
 * `migrations/0002_affiliate.sql`); the key can authenticate a person and
 * nothing else.
 *
 * `supabaseEnv()` returns null rather than throwing when they are unset,
 * because that is a real state for this repo: the marketing site runs fine
 * without them and every page outside `/affiliates` must keep building on a
 * machine that has never seen a Supabase key. Only the affiliate surface
 * insists, and it insists loudly — see `requireSupabaseEnv`.
 */

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

let cached: SupabaseEnv | null | undefined;

export function supabaseEnv(): SupabaseEnv | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  cached = url && anonKey ? { url, anonKey } : null;
  return cached;
}

/**
 * The same, for the code paths that cannot degrade.
 *
 * A login form that renders without a Supabase client is worse than one that
 * refuses to render: it takes a password, appears to submit, and silently does
 * nothing. The message names both variables and where to find them, because
 * the person hitting this is setting the project up for the first time.
 */
export function requireSupabaseEnv(): SupabaseEnv {
  const env = supabaseEnv();
  if (env) return env;

  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for the affiliate dashboard. " +
      "Both are in the Supabase dashboard under Project Settings → API, for the same project as DATABASE_URL.",
  );
}
