import "server-only";
import type { BizimHesapConfig } from "./config";

// ============================================================
// Bizim Hesap kimlik doğrulama (LIVE mod).
// TODO(gerçek-api): Resmi Bizim Hesap API dokümanı gelince doldurulacak.
// İmzalama/token şeması (Bearer? HMAC? apiKey header?) dokümana göre burada
// merkezîleştirilecek; adapter bu yardımcıyı kullanacak.
// ============================================================

export interface BizimHesapAuthHeaders {
  [header: string]: string;
}

/**
 * Live istekler için auth başlıklarını üretir.
 * ŞU AN: gerçek şema bilinmediğinden yalnızca yer tutucu döndürür.
 * Endpoint UYDURULMAZ; gerçek şema gelene kadar live adapter zaten çalışmaz.
 */
export function buildAuthHeaders(cfg: BizimHesapConfig): BizimHesapAuthHeaders {
  // TODO(gerçek-api): Doğru başlıkları resmi dokümana göre kur.
  // Örn (VARSAYIM DEĞİL — doküman gelince netleşecek):
  //   Authorization: `Bearer ${cfg.apiKey}` VEYA imzalı HMAC.
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Company-Id": cfg.companyId,
  };
}
