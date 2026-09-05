"use client";

import { useTransition } from "react";
import { updateOrderStatus, updatePaymentStatus } from "@/lib/actions/admin-orders";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

const ORDER_STATUSES: { v: OrderStatus; l: string }[] = [
  { v: "NEW", l: "Yeni" },
  { v: "AWAITING_PAYMENT", l: "Ödeme Bekliyor" },
  { v: "PAID", l: "Ödeme Alındı" },
  { v: "PREPARING", l: "Hazırlanıyor" },
  { v: "SHIPPED", l: "Kargoya Verildi" },
  { v: "DELIVERED", l: "Teslim Edildi" },
  { v: "CANCELLED", l: "İptal" },
  { v: "REFUNDED", l: "İade" },
];
const PAY_STATUSES: { v: PaymentStatus; l: string }[] = [
  { v: "PENDING", l: "Bekliyor" },
  { v: "PAID", l: "Ödendi" },
  { v: "FAILED", l: "Başarısız" },
  { v: "CANCELLED", l: "İptal" },
  { v: "REFUNDED", l: "İade" },
];

export function StatusControl({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-muted">Sipariş Durumu</span>
        <select
          defaultValue={status}
          disabled={pending}
          onChange={(e) => start(() => updateOrderStatus(orderId, e.target.value as OrderStatus))}
          className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.v} value={s.v}>{s.l}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-muted">Ödeme Durumu</span>
        <select
          defaultValue={paymentStatus}
          disabled={pending}
          onChange={(e) => start(() => updatePaymentStatus(orderId, e.target.value as PaymentStatus))}
          className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
        >
          {PAY_STATUSES.map((s) => (
            <option key={s.v} value={s.v}>{s.l}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
