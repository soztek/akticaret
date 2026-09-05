const NUM = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 2490 -> "2.490 TL" ; 124.5 -> "124,50 TL" */
export function formatTL(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0 TL";
  return `${NUM.format(n)} TL`;
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

/**
 * Kampanya rozetini normalize eder.
 * Kullanıcı sadece sayı yazdıysa ("20", "%20", "20 %") → "%20".
 * Metin yazdıysa ("Yılbaşı", "2. Ürün Bedava") aynen kalır.
 */
export function formatBadge(badge: string | null | undefined): string | null {
  if (!badge) return null;
  const t = badge.trim();
  if (!t) return null;
  const m = t.match(/^%?\s*(\d+(?:[.,]\d+)?)\s*%?$/);
  return m ? `%${m[1]}` : t;
}
