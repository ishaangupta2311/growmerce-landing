import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { supabaseEnv } from "./env";

/**
 * The session check that runs in Proxy — and the only place a token rotation
 * is guaranteed to reach the browser.
 *
 * Supabase rotates tokens on refresh: reading a session whose access token has
 * expired writes a new access/refresh pair. A Server Component cannot set
 * cookies, so `supabaseServer()` swallows that write. If the *first* thing to
 * notice an expired token is a page render, the rotated pair never leaves the
 * server: the browser's next request carries the old refresh token, which
 * Supabase has already consumed, and the partner is signed out for no reason
 * they can see. @supabase/ssr is explicit that middleware has to do this
 * write, and this is that.
 *
 * It runs before the render, on every `/affiliates` request that carries a
 * session cookie, with a client bound to the request's cookies. Anything
 * Supabase asks to set is written twice: onto the request, so the render that
 * follows reads the fresh tokens through `cookies()`; and — via `apply` — onto
 * whichever response Proxy ends up returning, so the browser gets them too.
 *
 * `getClaims()` rather than `getUser()`. Both refresh an expired session, but
 * `getClaims` then verifies the JWT locally against the project's signing
 * keys, which auth-js caches process-wide, so on a warm instance this is a
 * cookie read and a signature check — the "optimistic" cost the Next.js auth
 * guide asks Proxy to stay within, given it also runs for every prefetch. A
 * project still on a symmetric JWT secret has no key to check locally and
 * auth-js falls back to `getUser()` there. Either way this is not the
 * authorisation check: `requirePartner()` is, in every page and action
 * behind the gate.
 *
 * No `server-only` here. That package throws unless the bundle is built under
 * the `react-server` condition, and Proxy is not. Nothing here touches
 * `next/headers` either, which is what would make a module unusable outside
 * a render.
 */

type Pending = { name: string; value: string; options: CookieOptions };

export type RefreshedSession = {
  /** A session Supabase accepts — refreshed on the way if it had to be. */
  signedIn: boolean;
  /** Puts any rotated cookies on the response that is actually being sent. */
  apply<R extends NextResponse>(response: R): R;
};

export async function refreshSession(request: NextRequest): Promise<RefreshedSession> {
  /* Keyed by name. @supabase/ssr flushes one rotation through `setAll` more
     than once — the storage write and the auth-state callback each apply it —
     and two identical Set-Cookie headers are noise the browser has to resolve.
     The last write for a name is the only one that matters. */
  const pending = new Map<string, Pending>();
  const apply = <R extends NextResponse>(response: R): R => {
    for (const { name, value, options } of pending.values()) {
      response.cookies.set(name, value, options);
    }
    return response;
  };

  const env = supabaseEnv();
  if (!env) return { signedIn: false, apply };

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const cookie of toSet) {
          /* The request first, so `NextResponse.next({ request })` carries the
             new tokens into the render. The response is not known yet. */
          request.cookies.set(cookie.name, cookie.value);
          pending.set(cookie.name, cookie);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  return { signedIn: !error && Boolean(data?.claims), apply };
}
