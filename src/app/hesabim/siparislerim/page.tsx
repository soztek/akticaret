import { redirect } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTL, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Siparişlerim" };

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  NEW: { t: "Yeni", c: "bg-navy/10 text-navy" },
  AWAITING_PAYMENT: { t: "Ödeme Bekliyor", c: "bg-warning/10 text-warning" },
  PAID: { t: "Ödeme Alındı", c: "bg-success/10 text-success" },
  PREPARING: { t: "Hazırlanıyor", c: "bg-info/10 text-info" },
  SHIPPED: { t: "Kargoda", c: "bg-info/10 text-info" },
  DELIVERED: { t: "Teslim Edildi", c: "bg-success/10 text-success" },
  CANCELLED: { t: "İptal", c: "bg-danger/10 text-danger" },
  REFUNDED: { t: "İade", c: "bg-danger/10 text-danger" },
};

export default async function MyOrders() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/hesabim/siparislerim");

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { id: true } } },
  });

  return (
    <main className="container-ak py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-5 text-2xl font-bold text-ink">Siparişlerim</h1>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-paper p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-faint" />
            <p className="mt-3 text-muted">Henüz siparişiniz yok.</p>
            <Link href="/" className="mt-4 inline-block rounded-lg bg-orange px-5 py-2.5 font-semibold text-white">
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const s = STATUS_LABEL[o.status] ?? { t: o.status, c: "bg-navy/10 text-navy" };
              return (
                <Link
                  key={o.id}
                  href={`/siparis/${o.orderNumber}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-paper p-4 transition hover:border-orange/50"
                >
                  <div>
                    <p className="font-semibold text-ink">{o.orderNumber}</p>
                    <p className="text-sm text-muted">{formatDate(o.createdAt)} · {o.items.length} ürün</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.c}`}>{s.t}</span>
                    <p className="mt-1 font-bold text-navy">{formatTL(Number(o.grandTotal))}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
