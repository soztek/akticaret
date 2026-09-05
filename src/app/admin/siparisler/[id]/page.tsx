import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { formatTL, formatDate } from "@/lib/format";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-labels";
import { StatusControl } from "./status-control";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { email: true } } },
  });
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/siparisler" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-orange">
        <ArrowLeft className="h-4 w-4" /> Siparişlere dön
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{order.orderNumber}</h1>
          <p className="text-sm text-muted">
            {formatDate(order.createdAt)} ·{" "}
            <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">
              {order.customerType === "B2B" ? "Bayi" : "Perakende"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-paper p-5">
        <StatusControl orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />
      </div>

      <div className="mt-5 rounded-xl border border-line bg-paper p-5">
        <h2 className="mb-3 font-bold text-ink">Ürünler</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1.5 font-semibold">Ürün</th>
              <th className="py-1.5 font-semibold">Adet</th>
              <th className="py-1.5 font-semibold">Birim</th>
              <th className="py-1.5 text-right font-semibold">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.items.map((it) => (
              <tr key={it.id}>
                <td className="py-2 text-ink">
                  {it.productName} {it.sku && <span className="text-xs text-faint">({it.sku})</span>}
                </td>
                <td className="py-2 text-muted">{it.quantity}</td>
                <td className="py-2 text-muted">{formatTL(Number(it.unitPrice))}</td>
                <td className="py-2 text-right font-medium text-ink">{formatTL(Number(it.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Ara Toplam</dt><dd>{formatTL(Number(order.subtotal))}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">KDV</dt><dd>{formatTL(Number(order.vatTotal))}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Kargo</dt><dd>{formatTL(Number(order.shippingTotal))}</dd></div>
          <div className="flex justify-between border-t border-line pt-2"><dt className="font-bold text-ink">Genel Toplam</dt><dd className="text-lg font-extrabold text-navy">{formatTL(Number(order.grandTotal))}</dd></div>
        </dl>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-5 text-sm">
          <h3 className="mb-2 font-bold text-ink">Müşteri / Teslimat</h3>
          <p className="text-ink">{order.billingName}</p>
          <p className="text-muted">{order.billingPhone}</p>
          {order.user && <p className="text-muted">{order.user.email}</p>}
          <p className="mt-1 text-muted">{order.billingAddress}</p>
          <p className="text-muted">{[order.billingDistrict, order.billingCity].filter(Boolean).join(" / ")}</p>
        </div>
        <div className="rounded-xl border border-line bg-paper p-5 text-sm">
          <h3 className="mb-2 font-bold text-ink">Ödeme</h3>
          <p className="text-ink">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
          <p className="text-muted">Ödeme durumu: {PAYMENT_STATUS_LABEL[order.paymentStatus]}</p>
          {order.note && <p className="mt-2 text-muted">Not: {order.note}</p>}
        </div>
      </div>
    </div>
  );
}
