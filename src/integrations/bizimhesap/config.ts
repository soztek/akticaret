import "server-only";

// ============================================================
// Bizim Hesap yapılandırması — SADECE sunucu tarafında okunur.
// API bilgileri asla frontend'e sızdırılmaz.
// ============================================================

export interface BizimHesapConfig {
  mode: "mock" | "live";
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  companyId: string;
}

export function getBizimHesapConfig(): BizimHesapConfig {
  const mode = (process.env.BIZIMHESAP_MODE ?? "mock").toLowerCase();
  return {
    mode: mode === "live" ? "live" : "mock",
    apiUrl: process.env.BIZIMHESAP_API_URL ?? "",
    apiKey: process.env.BIZIMHESAP_API_KEY ?? "",
    apiSecret: process.env.BIZIMHESAP_API_SECRET ?? "",
    companyId: process.env.BIZIMHESAP_COMPANY_ID ?? "",
  };
}

/** Live modda gerekli tüm kimlik bilgileri var mı? */
export function isLiveConfigured(cfg: BizimHesapConfig): boolean {
  return Boolean(cfg.apiUrl && cfg.apiKey && cfg.companyId);
}
