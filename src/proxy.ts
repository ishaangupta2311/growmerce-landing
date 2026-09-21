import { NextResponse, type NextRequest } from "next/server";
import { readSessionValue, sessionCookieName, sessionCookieSecure, sessionSecret } from "@/lib/auth/cookie";

/**
 * The first gate on /admin: no valid session cookie, no admin page.
 *
 * This is the optimistic check the Next.js auth guide describes — it verifies
 * the cookie's signature and expiry without touching the database, so it is
 * cheap enough to run on every request and prefetch. It cannot know a session
 * was logged out, so it is not the only gate: `requireAdmin()` in
 * src/lib/auth/session.ts checks the session row in every admin layout, page
 * and Server Action.
 *
 * POSTs are let through untouched. They are Server Action calls, which check
 * the session themselves and answer with a redirect the client router
 * understands; a 307 from here would replay the POST against the login page.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || (request.method !== "GET" && request.method !== "HEAD")) {
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

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
