/**
 * The affiliate section of the admin.
 *
 * It sits in the same shell as the blog, but its pages are built from the
 * affiliate components — the ones the partner dashboard uses — and those are
 * drawn in the brand face. Setting it here keeps the tables and figures an
 * admin reconciles against a partner's own screen looking the same on both.
 *
 * No check of its own: the panel layout above calls `requireAdmin()`, and every
 * page and action beneath checks its own tab with `requireAccess`, which is
 * where it counts.
 */
export default function AdminAffiliatesLayout({ children }: { children: React.ReactNode }) {
  return <div className="font-bricolage">{children}</div>;
}
