import type { OrderStatus, PaymentStatus, CustomerType, PaymentMethod } from "@prisma/client";

/** Sipariş durumu Türkçe etiketi + rozet rengi (Tailwind sınıfı). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Yeni",
  AWAITING_PAYMENT: "Ödeme Bekliyor",
  PAID: "Ödeme Alındı",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  NEW: "bg-info/10 text-info",
  AWAITING_PAYMENT: "bg-warning/10 text-warning",
  PAID: "bg-success/10 text-success",
  PREPARING: "bg-info/10 text-info",
  SHIPPED: "bg-info/10 text-info",
  DELIVERED: "bg-success/10 text-success",
  CANCELLED: "bg-danger/10 text-danger",
  REFUNDED: "bg-muted/15 text-muted",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  PENDING: "bg-warning/10 text-warning",
  PAID: "bg-success/10 text-success",
  FAILED: "bg-danger/10 text-danger",
  CANCELLED: "bg-danger/10 text-danger",
  REFUNDED: "bg-muted/15 text-muted",
};

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  B2C: "Bireysel",
  B2B: "Kurumsal",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CARD: "Kredi Kartı",
  BANK_TRANSFER: "Havale / EFT",
  ACCOUNT: "Cari Hesap (Vadeli)",
};

export const orderStatusLabel = (s: OrderStatus) => ORDER_STATUS_LABEL[s] ?? s;
export const paymentStatusLabel = (s: PaymentStatus) => PAYMENT_STATUS_LABEL[s] ?? s;
export const customerTypeLabel = (t: CustomerType) => CUSTOMER_TYPE_LABEL[t] ?? t;
export const paymentMethodLabel = (m: PaymentMethod) => PAYMENT_METHOD_LABEL[m] ?? m;
