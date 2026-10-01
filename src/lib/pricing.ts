// B2C / B2B fiyat çözümleme (saf fonksiyon — client + server kullanılabilir).
// Öncelik (spec §14): bayi ise b2bPrice → grup indirimi; değilse b2cPrice.

export type PriceView = {
  isDealer: boolean;
  discount: number; // bayiye özel iskonto yüzdesi
  canUseAccount: boolean; // vadeli (cari hesap) ile ödeyebilir mi
};

export const GUEST_VIEW: PriceView = { isDealer: false, discount: 0, canUseAccount: false };

export type PricedProduct = {
  b2cPrice: number;
  b2bPrice: number | null;
  listPrice: number;
};

export type ResolvedPrice = {
  price: number; // gösterilecek/uygulanacak fiyat (KDV hariç)
  compareAt: number | null; // üstü çizili referans (varsa)
  isDealer: boolean;
  label: string | null; // "Bayi Fiyatı" vb.
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function resolvePrice(p: PricedProduct, view: PriceView): ResolvedPrice {
  if (view.isDealer) {
    const base = p.b2bPrice ?? p.b2cPrice;
    const price = view.discount > 0 ? round2(base * (1 - view.discount / 100)) : base;
    return {
      price,
      compareAt: p.b2cPrice > price ? p.b2cPrice : null,
      isDealer: true,
      label: "Bayi Fiyatı",
    };
  }
  return {
    price: p.b2cPrice,
    compareAt: p.listPrice > p.b2cPrice ? p.listPrice : null,
    isDealer: false,
    label: null,
  };
}
