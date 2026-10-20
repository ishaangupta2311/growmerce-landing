import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/session";

/**
 * Every page in the admin renders inside this layout, and this layout checks
 * the Supabase session and the team before rendering anything. Pages repeat
 * the check with their own tab's permission (layouts do not re-run on every
 * client navigation, and a page can be requested on its own), and so does
 * every Server Action.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell admin={{ name: admin.name, email: admin.email, roleName: admin.roleName, grant: admin.grant }}>
      {children}
    </AdminShell>
  );
}
