// Sipariş tutarları — KDV hariç fiyatlar üzerinden. Saf fonksiyon (client + server).

export const SHIPPING_COST = 150; // TL (KDV dahil kabul)
export const FREE_SHIPPING_THRESHOLD = 5000; // KDV hariç ara toplam bu tutarı geçerse kargo bedava

export type CalcLine = { price: number; qty: number; vatRate?: number };

export type OrderTotals = {
  subtotal: number; // KDV hariç ürün toplamı
  vatTotal: number; // toplam KDV
  shipping: number; // kargo
  grandTotal: number; // genel toplam (KDV + kargo dahil)
  freeShipping: boolean;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeTotals(lines: CalcLine[]): OrderTotals {
  let subtotal = 0;
  let vatTotal = 0;
  for (const l of lines) {
    const lineNet = l.price * l.qty;
    subtotal += lineNet;
    vatTotal += lineNet * ((l.vatRate ?? 20) / 100);
  }
  subtotal = round2(subtotal);
  vatTotal = round2(vatTotal);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
  const shipping = freeShipping ? 0 : SHIPPING_COST;
  return {
    subtotal,
    vatTotal,
    shipping,
    grandTotal: round2(subtotal + vatTotal + shipping),
    freeShipping,
  };
}
