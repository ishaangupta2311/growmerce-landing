import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabaseEnv, supabaseEnv } from "./env";

/**
 * A Supabase client bound to the current request's cookies.
 *
 * Supabase keeps a short-lived access token and a long-lived refresh token in
 * cookies, and rotates them: reading the session can *write* a new pair. That
 * is why `setAll` exists at all, and why the try/catch around it is not
 * laziness.
 *
 * Next.js forbids setting cookies while a Server Component renders — the
 * response headers are already on their way — so `cookies().set()` throws
 * there. Swallowing it keeps a routine rotation from becoming a 500, but it is
 * not the fix: a rotation the browser never receives leaves it holding a
 * refresh token Supabase has already consumed, and the next request signs the
 * partner out. The fix is that the rotation happens *before* the render —
 * `src/lib/supabase/proxy.ts` refreshes the session in Proxy on every
 * `/affiliates` request that carries one, and writes the new tokens onto the
 * request this render reads and the response the browser keeps. What reaches
 * this catch is the narrow case of a token expiring in the gap between the
 * two, and Proxy repairs that on the very next request.
 *
 * Not memoised. Each caller gets its own client bound to its own cookie store,
 * which is what keeps a Server Action's writes from landing on a stale copy.
 */
export async function supabaseServer() {
  const { url, anonKey } = requireSupabaseEnv();
  const store = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            store.set(name, value, options);
          }
        } catch {
          /* Rendering a Server Component. See above — the session is still
             valid for this request, and Proxy persists the rotation next time. */
        }
      },
    },
  });
}

/**
 * The signed-in Supabase user, or null.
 *
 * `getUser()` and not `getSession()`. `getSession` reads the JWT out of the
 * cookie and trusts it, and the cookie is something the browser sends us —
 * anyone can put a well-formed JWT in one. `getUser` verifies it against the
 * auth server before answering, which costs a request and is the difference
 * between a session check and a suggestion.
 *
 * An unconfigured deployment answers null rather than throwing, and the two
 * callers want opposite things from that. `optionalPartner` treats it as
 * "nobody is signed in", which is what keeps the public programme page — a
 * marketing page that happens to greet a returning partner — readable on a
 * machine that has never had a Supabase key. Anything that has to *do*
 * something with a session goes through `supabaseServer()` directly and gets
 * the exception naming both variables, because a login form that quietly
 * accepts a password and does nothing is worse than one that refuses to render.
 */
export async function currentUser() {
  if (!supabaseEnv()) return null;

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}
