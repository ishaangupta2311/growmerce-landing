import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Every page in the panel renders inside this layout, and this layout checks
 * the session against the database before rendering anything. Pages repeat
 * the check (layouts do not re-run on every client navigation, and a page can
 * be requested on its own), and so does every Server Action.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell admin={{ name: admin.name, email: admin.email }}>{children}</AdminShell>;
}
