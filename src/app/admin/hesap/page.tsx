import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { AccountForms } from "./account-forms";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireStaff().catch(() => null);
  if (!user) redirect("/giris?next=/admin/hesap");

  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Hesabım</h1>
        <p className="text-sm text-muted">Giriş e-postanızı ve şifrenizi güncelleyin.</p>
      </div>
      <AccountForms currentEmail={user.email} currentName={user.name} />
    </div>
  );
}
