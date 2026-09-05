const TL = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 2490 -> "₺2.490" ; 124.5 -> "₺124,50" */
export function formatTL(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "₺0";
  return TL.format(n);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** İndirim yüzdesi (liste > satış ise). */
export function discountPercent(list: number, sale: number): number | null {
  if (list <= 0 || sale >= list) return null;
  return Math.round(((list - sale) / list) * 100);
}

/** KDV hariç net fiyattan KDV dahil brüt fiyat. */
export function grossPrice(net: number, vatRate = 20): number {
  return Math.round((net * (1 + vatRate / 100) + Number.EPSILON) * 100) / 100;
}
