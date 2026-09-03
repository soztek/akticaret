import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";
import { logoutAction } from "@/lib/actions/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ExternalLink } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/admin");
  if (!isStaffRole(user.role)) redirect("/hesabim");

  return (
    <div className="flex min-h-screen bg-mist">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-dark lg:flex">
        <div className="border-b border-navy-600/40 px-5 py-4">
          <Link href="/admin" className="text-lg font-extrabold text-paper">
            AK TİCARET <span className="text-orange-light">Yönetim</span>
          </Link>
        </div>
        <AdminSidebar />
      </aside>

      {/* İçerik */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-paper px-4 py-3 lg:px-6">
          <Link href="/admin" className="text-sm font-bold text-navy lg:hidden">
            AK TİCARET Yönetim
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 text-muted hover:text-orange"
            >
              <ExternalLink className="h-4 w-4" /> Siteyi Gör
            </Link>
            <span className="hidden text-muted sm:inline">
              {user.name} · {user.role}
            </span>
            <form action={logoutAction}>
              <button className="rounded-md border border-line px-3 py-1.5 font-medium text-ink hover:border-danger hover:text-danger">
                Çıkış
              </button>
            </form>
          </div>
        </header>

        {/* Mobil nav */}
        <div className="border-b border-line bg-navy-dark lg:hidden">
          <AdminSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
