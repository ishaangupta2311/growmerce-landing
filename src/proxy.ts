import { type NextRequest, NextResponse } from "next/server";

/**
 * A first, cheap gate on the affiliate dashboard.
 *
 * Next.js 16 renamed Middleware to Proxy; this is that file, and it is the only
 * one the project is allowed to have.
 *
 * **This is not the authorisation check.** It looks for the presence of a
 * Supabase session cookie and nothing more — it does not verify the token, and
 * a forged cookie of the right name gets past it. That is a deliberate trade:
 * Proxy runs on every request including every prefetch, so a round trip to the
 * auth server here would be paid many times per page. The real check is
 * `requirePartner()` in `src/lib/affiliate/session.ts`, which verifies the
 * token against Supabase and then reads the partner row, and every page and
 * action behind this gate calls it.
 *
 * What this does buy is the common case: a signed-out visitor clicking a
 * bookmarked dashboard link gets the login page immediately, with `next` set so
 * they land where they meant to, instead of a dashboard shell that renders and
 * then redirects.
 *
 * `/affiliates/admin` is listed too, and for that one the real check is
 * `requireAdmin()` in `src/lib/affiliate/admin.ts` — which answers a signed-in
 * non-admin with a 404 rather than a refusal, so this gate must never be the
 * thing that tells somebody the admin area exists.
 *
 * Scoped to `/affiliates` by the matcher below. The marketing pages are the
 * bulk of this site's traffic and none of them need a cookie read.
 */

/** Everything under these needs a session; the rest of `/affiliates` is public. */
const GUARDED = ["/affiliates/dashboard", "/affiliates/admin"];

/**
 * Supabase names its cookie `sb-<project-ref>-auth-token`, and chunks it into
 * `…-auth-token.0`, `…-auth-token.1` when the JWT outgrows a single cookie —
 * which it does as soon as a user carries any metadata, as ours do. Matching
 * the prefix rather than an exact name is what keeps this working across both
 * shapes and across a project-ref change.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (GUARDED.some((prefix) => pathname.startsWith(prefix)) && !hasSessionCookie(request)) {
    const login = new URL("/affiliates/login", request.nextUrl.origin);
    /* Only the path, never the full URL: `next` is echoed into a link on the
       login page, and a full URL there would be an open redirect. The callback
       and the login page both re-check it. */
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/affiliates/:path*"],
};
