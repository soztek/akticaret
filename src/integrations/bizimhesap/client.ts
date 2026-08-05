import "server-only";
import { getBizimHesapConfig, isLiveConfigured } from "./config";
import { MockBizimHesapAdapter } from "./mock-adapter";
import { LiveBizimHesapAdapter } from "./live-adapter";
import type { BizimHesapAdapter } from "./types";

// ============================================================
// Fabrika: env'e göre doğru adapter'ı döndürür.
// BIZIMHESAP_MODE=live ama kimlik bilgileri eksikse mock'a düşmez —
// live adapter döner ve testConnection açıkça "yapılandırılmadı" der.
// (Sessizce sahte veri göstermemek için.)
// ============================================================

let cached: BizimHesapAdapter | null = null;

export function getBizimHesapAdapter(): BizimHesapAdapter {
  if (cached) return cached;
  const cfg = getBizimHesapConfig();
  cached = cfg.mode === "live" ? new LiveBizimHesapAdapter(cfg) : new MockBizimHesapAdapter();
  return cached;
}

/** Test/override için önbelleği temizle. */
export function resetBizimHesapAdapter() {
  cached = null;
}

export { getBizimHesapConfig, isLiveConfigured };
