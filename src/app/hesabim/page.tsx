import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ bayi?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/hesabim");
  const { bayi } = await searchParams;

  return (
    <main className="container-ak py-12">
      <div className="mx-auto max-w-2xl rounded-2xl bg-paper p-8 shadow-sm">
        {bayi === "beklemede" && (
          <div className="mb-6 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
            <p className="font-semibold text-success">Bayi başvurunuz alındı ✓</p>
            <p className="mt-1 text-muted">
              Başvurunuz incelendikten sonra onaylanacak. Onaylanınca bayi (kurumsal) fiyatlarını görebileceksiniz.
            </p>
          </div>
        )}
        <h1 className="text-2xl font-bold text-ink">Hesabım</h1>
        <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Ad Soyad</dt>
            <dd className="font-medium text-ink">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted">E-posta</dt>
            <dd className="font-medium text-ink">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Rol</dt>
            <dd className="font-medium text-ink">{user.role}</dd>
          </div>
        </dl>
        <form action={logoutAction} className="mt-8">
          <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-danger hover:text-danger">
            Çıkış Yap
          </button>
        </form>
      </div>
    </main>
  );
}
