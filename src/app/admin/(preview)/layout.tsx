import { requireAdmin } from "@/lib/admin/session";

/**
 * Previews render the public article template, so they sit outside the admin
 * shell — but they show drafts, so they are every bit as protected as the
 * rest of /admin: Proxy on the way in, this check, and the page's own.
 */
export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
