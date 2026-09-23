import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

/**
 * The first gate on the two private areas of the site: the partner dashboard
 * under `/affiliates/dashboard`, and the admin — blog and affiliates — under
 * `/admin`.
 *
 * Next.js 16 renamed Middleware to Proxy; this is that file, and the framework
 * allows exactly one of it per project. Both areas sign in through Supabase, so
 * one guard serves them. It used to be two: the blog admin had its own login,
 * its own cookie and its own check here, until it moved onto the same account
 * as everything else.
 *
 * **This is not the authorisation check.** It is the optimistic check the
 * Next.js auth guide describes: cheap enough to run on every request and every
 * prefetch, and unable to know who is on the admin allowlist or which partner
 * a user is. The real checks live server-side and run in every guarded layout,
 * page and Server Action — `requirePartner()` in `src/lib/affiliate/session.ts`
 * and `requireAdmin()` in `src/lib/admin/session.ts`.
 *
 * What the gate buys is the common case: a signed-out visitor clicking a
 * bookmarked link gets the login page immediately, instead of a shell that
 * renders and then redirects. It also has a job only Proxy can do — keeping
 * the browser's Supabase tokens fresh. See `src/lib/supabase/proxy.ts`.
 *
 * The matcher keeps this off the marketing pages, which are the bulk of this
 * site's traffic and none of which need a cookie read.
 */

/** Everything under these needs a session; the rest of `/affiliates` is public. */
const GUARDED = ["/affiliates/dashboard", "/admin"];

function isGuarded(pathname: string): boolean {
  return GUARDED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

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

function toLogin(request: NextRequest, pathname: string) {
  const login = new URL("/affiliates/login", request.nextUrl.origin);
  /* Only the path, never the full URL: `next` is echoed into a link on the
     login page, and a full URL there would be an open redirect. The sign-in
     action and the auth callback both re-check it. */
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

/**
 * Cheap step first. No session cookie at all is the common signed-out case —
 * a bookmarked link — and is answered from the cookie header alone: a redirect
 * if the path is guarded, a pass if it is not.
 *
 * With a cookie present, `refreshSession` verifies it and, if the access token
 * has expired, rotates it and carries the new pair into both the render and
 * the response. That runs for every matched path, not only the guarded ones,
 * because the public programme page and the application form read the session
 * too, and a rotation that happens during one of those renders is exactly the
 * kind that used to be lost.
 *
 * A guarded path whose cookie verifies as nobody — expired beyond refresh,
 * forged, or issued by a project this deployment no longer talks to — goes to
 * the login page like the absent one, carrying the cleared cookies Supabase
 * asked for so the browser stops sending it.
 *
 * `/admin` is behind the same check, and its real gate answers a signed-in
 * non-admin with a 404 rather than a refusal — so this must never become the
 * thing that tells somebody the admin exists.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* POSTs are let through untouched. They are Server Action calls, which check
     the session themselves and answer with a redirect the client router
     understands; a 307 from here would replay the POST against the login page
     instead. */
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const guarded = isGuarded(pathname);

  if (!hasSupabaseSessionCookie(request)) {
    return guarded ? toLogin(request, pathname) : NextResponse.next();
  }

  const session = await refreshSession(request);
  if (guarded && !session.signedIn) {
    return session.apply(toLogin(request, pathname));
  }
  return session.apply(NextResponse.next({ request }));
}

export const config = {
  matcher: ["/affiliates/:path*", "/admin", "/admin/:path*"],
};
