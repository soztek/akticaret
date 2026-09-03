import { db } from "@/lib/db";
import { formatTL, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      billingName: true,
      customerType: true,
      grandTotal: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Siparişler</h1>
        <p className="text-sm text-muted">{orders.length} sipariş</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper p-12 text-center text-muted">
          Henüz sipariş yok. Sepet & ödeme akışı devreye girince siparişler burada listelenecek.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full text-sm">
            <thead className="bg-mist text-left text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Sipariş No</th>
                <th className="px-4 py-2.5 font-semibold">Müşteri</th>
                <th className="px-4 py-2.5 font-semibold">Tip</th>
                <th className="px-4 py-2.5 font-semibold">Tutar</th>
                <th className="px-4 py-2.5 font-semibold">Durum</th>
                <th className="px-4 py-2.5 font-semibold">Ödeme</th>
                <th className="px-4 py-2.5 font-semibold">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-mist/50">
                  <td className="px-4 py-2.5 font-medium text-ink">{o.orderNumber}</td>
                  <td className="px-4 py-2.5 text-muted">{o.billingName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{o.customerType}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-navy">{formatTL(Number(o.grandTotal))}</td>
                  <td className="px-4 py-2.5 text-muted">{o.status}</td>
                  <td className="px-4 py-2.5 text-muted">{o.paymentStatus}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
