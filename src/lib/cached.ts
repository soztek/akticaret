import { unstable_cache, revalidateTag } from "next/cache";

/**
 * Vitrin (katalog) sorguları için ortak önbellek.
 *
 * Neden: Sayfalar her istekte DB'ye gidiyordu; botlar ürün/kategori sayfalarını
 * sürekli gezdiği için Neon veritabanı uykuya geçemiyor ve compute faturası
 * şişiyordu. Burada yalnızca HERKES İÇİN AYNI olan katalog verisi önbelleklenir;
 * bayiye özel fiyat görünümü (getPriceView) ve oturum bilgisi önbelleğe GİRMEZ.
 *
 * Kampanya başlangıç/bitiş pencereleri sorgu anına göre hesaplandığı için
 * süre 1 saat tutuldu. Admin değişikliklerinde ve siparişte (stok düşümü)
 * `invalidateCatalog()` ile anında yenilenir.
 *
 * Not: Önbellekten dönen veri JSON'dan geçer — Decimal alanlar string,
 * DateTime alanlar ISO string olarak gelir (Number() / new Date ile kullan).
 */
export const CATALOG_TAG = "catalog";
export const CATALOG_TTL = 60 * 60; // 1 saat

export function cachedCatalog<T>(key: (string | number | undefined | null)[], fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, ["catalog", ...key.map((k) => String(k ?? ""))], {
    tags: [CATALOG_TAG],
    revalidate: CATALOG_TTL,
  })();
}

/** Bir async fonksiyonu, argümanlarına göre anahtarlanan önbellekli sürümüne çevirir. */
export function cachedFn<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>) {
  return (...args: A): Promise<R> => cachedCatalog([name, JSON.stringify(args)], () => fn(...args));
}

/** Katalog önbelleğini hemen geçersiz kılar (server action ve route handler'da çalışır). */
export function invalidateCatalog() {
  revalidateTag(CATALOG_TAG, { expire: 0 });
}
