import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Landmark, Package } from "lucide-react";
import { db } from "@/lib/db";
import { formatTL, formatDate, grossPrice } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sipariş Alındı", robots: { index: false } };

const METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Havale / EFT",
  CARD: "Kredi Kartı",
  ACCOUNT: "Cari Hesap (Vadeli)",
};
const STATUS_LABEL: Record<string, string> = {
  NEW: "Yeni",
  AWAITING_PAYMENT: "Ödeme Bekliyor",
  PAID: "Ödeme Alındı",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};

export default async function OrderConfirmation({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="container-ak max-w-3xl py-10">
      <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-3 text-2xl font-bold text-ink">Siparişiniz alındı!</h1>
        <p className="mt-1 text-muted">
          Sipariş No: <strong className="text-ink">{order.orderNumber}</strong> · {formatDate(order.createdAt)}
        </p>
        <p className="mt-1 text-sm text-muted">Durum: {STATUS_LABEL[order.status] ?? order.status}</p>
      </div>

      {order.paymentMethod === "BANK_TRANSFER" && (
        <div className="mt-5 rounded-xl border border-line bg-paper p-5">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <Landmark className="h-5 w-5 text-orange" /> Havale / EFT Bilgileri
          </h2>
          <p className="mt-2 text-sm text-muted">
            Aşağıdaki tutarı, açıklamaya <strong className="text-ink">{order.orderNumber}</strong> yazarak
            gönderebilirsiniz. Ödemeniz onaylandığında siparişiniz hazırlanır.
          </p>
          <div className="mt-3 rounded-lg bg-mist p-3 text-sm">
            <p><span className="text-muted">Tutar:</span> <strong className="text-navy">{formatTL(Number(order.grandTotal))}</strong></p>
            <p className="mt-1 text-muted">Banka hesap bilgileri sipariş onayı ile iletilecektir.</p>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-line bg-paper p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
          <Package className="h-5 w-5 text-navy" /> Sipariş Detayı
        </h2>
        <ul className="divide-y divide-line">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-3 py-2 text-sm">
              <span className="text-ink">
                {it.quantity}× {it.productName}
                {it.sku && <span className="ml-1 text-xs text-faint">({it.sku})</span>}
              </span>
              <span className="whitespace-nowrap text-ink">{formatTL(grossPrice(Number(it.lineTotal), it.vatRate))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Ara Toplam</dt><dd>{formatTL(Number(order.subtotal) + Number(order.vatTotal))}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Kargo</dt><dd>{Number(order.shippingTotal) === 0 ? "Bedava" : formatTL(Number(order.shippingTotal))}</dd></div>
          <div className="flex justify-between border-t border-line pt-2"><dt className="font-bold text-ink">Genel Toplam</dt><dd className="text-lg font-extrabold text-navy">{formatTL(Number(order.grandTotal))}</dd></div>
        </dl>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-5 text-sm">
          <h3 className="mb-2 font-bold text-ink">Teslimat</h3>
          <p className="text-ink">{order.billingName}</p>
          <p className="text-muted">{order.billingPhone}</p>
          <p className="text-muted">{order.billingAddress}</p>
          <p className="text-muted">{[order.billingDistrict, order.billingCity].filter(Boolean).join(" / ")}</p>
        </div>
        <div className="rounded-xl border border-line bg-paper p-5 text-sm">
          <h3 className="mb-2 font-bold text-ink">Ödeme</h3>
          <p className="text-ink">{METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
          <p className="text-muted">{order.customerType === "B2B" ? "Bayi siparişi" : "Perakende sipariş"}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-lg border border-line px-6 py-3 font-semibold text-ink hover:border-orange">
          Ana Sayfa
        </Link>
        <Link href="/hesabim/siparislerim" className="rounded-lg bg-orange px-6 py-3 font-semibold text-white hover:bg-orange-600">
          Siparişlerim
        </Link>
      </div>
    </div>
  );
}
