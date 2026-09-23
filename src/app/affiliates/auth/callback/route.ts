import { type NextRequest, NextResponse } from "next/server";

import { safeNext } from "@/lib/supabase/safe-next";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Where every link Supabase emails comes back to: the confirmation on a new
 * account, and the recovery link behind "forgot password".
 *
 * A Route Handler rather than a page, because this is the one place in the
 * affiliate flow that must *write* the session cookies, and Next.js will not
 * let a Server Component set a cookie — the response has already begun.
 *
 * Two link shapes, because Supabase has two depending on how old the project's
 * email templates are. `?code=` is the PKCE flow, exchanged for a session.
 * `?token_hash=&type=` is the older one-time-token link, verified instead. Both
 * end in the same place: cookies set by `supabaseServer`, and a redirect.
 */

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const supabase = await supabaseServer();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  let failed: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = error?.message ?? null;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "recovery" | "invite" | "email_change" | "magiclink",
      token_hash: tokenHash,
    });
    failed = error?.message ?? null;
  } else {
    failed = "no_token";
  }

  if (failed) {
    /* Almost always an expired link or one already used — both of which read to
       the person as "I clicked it and nothing happened", so the login page is
       told to say so rather than leaving them staring at a form. The reason
       goes to the log, not to the query string. */
    console.warn(`[affiliate] auth callback failed — ${failed.slice(0, 120)}`);
    return NextResponse.redirect(new URL("/affiliates/login?expired=1", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
