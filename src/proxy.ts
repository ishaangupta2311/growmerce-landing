import { NextResponse, type NextRequest } from "next/server";
import { readSessionValue, sessionCookieName, sessionCookieSecure, sessionSecret } from "@/lib/auth/cookie";

/**
 * The first, cheap gate on both private areas of the site.
 *
 * Next.js 16 renamed Middleware to Proxy; this is that file, and the framework
 * allows exactly one of it per project. Two independent guards therefore share
 * it: `/affiliates` (partner dashboard and affiliate admin, authenticated by
 * Supabase) and `/admin` (the blog admin, authenticated by our own signed
 * cookie). They stay separate functions below — they verify different things
 * and answer to different session modules.
 *
 * **Neither is the authorisation check.** Both are the optimistic check the
 * Next.js auth guide describes: cheap enough to run on every request and every
 * prefetch, and unable to know a session was logged out. The real checks live
 * server-side and run in every guarded layout, page and Server Action —
 * `requirePartner()` in `src/lib/affiliate/session.ts`, `requireAdmin()` in
 * `src/lib/affiliate/admin.ts` for the affiliate admin, and `requireAdmin()` in
 * `src/lib/auth/session.ts` for the blog admin.
 *
 * What the gate buys is the common case: a signed-out visitor clicking a
 * bookmarked link gets the login page immediately, instead of a dashboard
 * shell that renders and then redirects.
 *
 * The matcher keeps this off the marketing pages, which are the bulk of this
 * site's traffic and none of which need a cookie read.
 */

/** Everything under these needs a partner session; the rest of `/affiliates` is public. */
const AFFILIATE_GUARDED = ["/affiliates/dashboard", "/affiliates/admin"];

/**
 * Supabase names its cookie `sb-<project-ref>-auth-token`, and chunks it into
 * `…-auth-token.0`, `…-auth-token.1` when the JWT outgrows a single cookie —
 * which it does as soon as a user carries any metadata, as ours do. Matching
 * the prefix rather than an exact name is what keeps this working across both
 * shapes and across a project-ref change.
 */
function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
}

/**
 * Presence only — the token is not verified here, and a forged cookie of the
 * right name gets past. That is deliberate: verifying would mean a round trip
 * to the auth server on every prefetch. `requirePartner()` does the real work.
 *
 * `/affiliates/admin` is guarded by the same cookie check, but its real gate
 * answers a signed-in non-admin with a 404 rather than a refusal — so this
 * must never become the thing that tells somebody the admin area exists.
 */
function guardAffiliates(request: NextRequest, pathname: string) {
  if (!AFFILIATE_GUARDED.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }
  if (hasSupabaseSessionCookie(request)) {
    return NextResponse.next();
  }

  const login = new URL("/affiliates/login", request.nextUrl.origin);
  /* Only the path, never the full URL: `next` is echoed into a link on the
     login page, and a full URL there would be an open redirect. The callback
     and the login page both re-check it. */
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

/**
 * Verifies the cookie's signature and expiry without touching the database, so
 * it is cheap enough for every request. It cannot know a session was logged
 * out; `requireAdmin()` checks the session row behind it.
 */
async function guardAdmin(request: NextRequest, pathname: string) {
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const name = sessionCookieName();
  const value = request.cookies.get(name)?.value;
  if (value && (await readSessionValue(value, sessionSecret()))) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  /* A cookie that failed the check is forged, expired or signed with a
     rotated secret — none of them worth sending again. A `__Host-` cookie is
     only cleared by a Set-Cookie that repeats its Secure and Path. */
  if (value) response.cookies.delete({ name, path: "/", secure: sessionCookieSecure() });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* POSTs are let through untouched, for both areas. They are Server Action
     calls, which check the session themselves and answer with a redirect the
     client router understands; a 307 from here would replay the POST against
     the login page instead. */
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  return pathname.startsWith("/affiliates")
    ? guardAffiliates(request, pathname)
    : guardAdmin(request, pathname);
}

export const config = {
  matcher: ["/affiliates/:path*", "/admin", "/admin/:path*"],
};
