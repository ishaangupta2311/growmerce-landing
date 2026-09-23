/**
 * Where to land after signing in — by the form, or by a link Supabase emailed.
 *
 * `next` is a path somebody was trying to reach when `src/proxy.ts` sent them
 * to the login page. By the time it arrives here it is a form field or a query
 * parameter out of an email, and either is whatever the sender chose to put
 * there: anybody can send anybody a link. Accepting it unchecked turns sign-in
 * into an open redirect — a link that genuinely comes from growmerce.ai,
 * genuinely signs the person in, and then deposits them on somebody else's
 * site.
 *
 * So it must be a path inside one of the two signed-in areas: the partner
 * dashboard's `/affiliates/…`, or the admin's `/admin` and anything under it.
 * `/admin` is matched exactly or with a following slash, so `/adminer` is not
 * a way in. The leading `//` check is the one that is easy to miss:
 * `//evil.example` is a protocol-relative URL, not a path, and `startsWith("/")`
 * alone lets it through.
 *
 * One function for both callers — the sign-in action and the auth callback —
 * because two copies of an allowlist drift, and the one that drifts looser is
 * the one that gets found.
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || raw.startsWith("//")) return "/affiliates/dashboard";

  const allowed =
    raw.startsWith("/affiliates/") || raw === "/admin" || raw.startsWith("/admin/");
  return allowed ? raw : "/affiliates/dashboard";
}
