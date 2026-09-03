import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { B2BApplicationForm } from "./form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Bayilik Başvurusu" };

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "Başvurunuz inceleniyor", cls: "bg-warning/10 text-warning" },
  APPROVED: { text: "Bayi hesabınız onaylandı ✓", cls: "bg-success/10 text-success" },
  REJECTED: { text: "Başvurunuz reddedildi", cls: "bg-danger/10 text-danger" },
  SUSPENDED: { text: "Bayi hesabınız askıda", cls: "bg-danger/10 text-danger" },
};

export default async function B2BApplyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/bayi/basvuru");

  const existing = await db.b2BCustomer.findUnique({ where: { userId: user.id } });

  return (
    <div className="container-ak max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-ink">Bayilik Başvurusu</h1>
      <p className="mt-2 text-muted">
        Bayilere özel fiyatlar, vadeli alım ve toptan avantajlarından yararlanmak için başvurun.
        Başvurunuz incelendikten sonra bilgilendirileceksiniz.
      </p>

      {existing && (
        <div className={`mt-5 rounded-lg px-4 py-3 text-sm font-medium ${STATUS_LABEL[existing.status]?.cls}`}>
          {STATUS_LABEL[existing.status]?.text}
          {existing.status === "APPROVED" && (
            <>
              {" "}
              <Link href="/" className="underline">Alışverişe başla</Link>
            </>
          )}
        </div>
      )}

      {existing?.status !== "APPROVED" && (
        <div className="mt-6">
          <B2BApplicationForm
            defaults={{
              companyName: existing?.companyName ?? "",
              contactName: existing?.contactName ?? user.name,
              phone: existing?.phone ?? user.phone ?? "",
              email: existing?.email ?? user.email,
            }}
          />
        </div>
      )}
    </div>
  );
}
