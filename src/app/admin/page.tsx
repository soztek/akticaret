import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";
import { logoutAction } from "@/lib/actions/auth";

export default async function AdminHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/admin");
  if (!isStaffRole(user.role)) redirect("/hesabim");

  return (
    <main className="min-h-screen bg-mist">
      <header className="bg-navy text-paper">
        <div className="container-ak flex items-center justify-between py-4">
          <span className="font-bold">
            AK TİCARET <span className="text-orange-light">Yönetim</span>
          </span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-mist/80">{user.name}</span>
            <form action={logoutAction}>
              <button className="rounded-md bg-navy-600 px-3 py-1.5 hover:bg-navy-400">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="container-ak py-8">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-2 text-muted">
          Admin panel iskeleti (FAZ 3&apos;te modüller eklenecek). Rol:{" "}
          <strong className="text-ink">{user.role}</strong>
        </p>
      </div>
    </main>
  );
}
