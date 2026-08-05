import "server-only";
import type { BizimHesapConfig } from "./config";
import { buildAuthHeaders } from "./auth";
import {
  type BizimHesapAdapter,
  type BHConnectionStatus,
  type BHProduct,
  type BHCategory,
  type BHCustomer,
  type BHOrderInput,
  type BHOrderResult,
  type BHInvoiceResult,
  BizimHesapNotSupportedError,
} from "./types";

// ============================================================
// LIVE ADAPTER — gerçek Bizim Hesap API'si.
// ------------------------------------------------------------
// ⚠️ Gerçek API endpoint'leri ve kimlik şeması HENÜZ verilmedi.
// Bu adapter, resmi dokümana göre doldurulacak GERÇEK HTTP çağrılarının
// yerini tutar. Endpoint UYDURULMAZ: her metod, doküman gelene kadar
// açıkça "yapılandırılmadı" hatası fırlatır. Böylece SAHTE bir "çalışan
// entegrasyon" izlenimi verilmez.
// ============================================================

export class LiveBizimHesapAdapter implements BizimHesapAdapter {
  readonly mode = "live" as const;

  constructor(private readonly cfg: BizimHesapConfig) {}

  /** İleride her istek bu yardımcı üzerinden gidecek. */
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    // TODO(gerçek-api): Doküman gelince tam URL + hata yönetimi + retry.
    const url = `${this.cfg.apiUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const res = await fetch(url, {
      ...init,
      headers: { ...buildAuthHeaders(this.cfg), ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Bizim Hesap API hatası: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  }

  async testConnection(): Promise<BHConnectionStatus> {
    // TODO(gerçek-api): Gerçek "ping"/hesap-bilgisi endpoint'i ile doğrula.
    return {
      connected: false,
      mode: "live",
      message:
        "Live mod seçili ancak gerçek Bizim Hesap API dokümanı/endpoint'leri henüz tanımlanmadı. Bağlantı doğrulanamıyor.",
    };
  }

  async listProducts(): Promise<{ items: BHProduct[]; hasMore: boolean }> {
    throw new BizimHesapNotSupportedError("listProducts (gerçek endpoint bekleniyor)");
  }

  async listCategories(): Promise<BHCategory[]> {
    throw new BizimHesapNotSupportedError("listCategories (gerçek endpoint bekleniyor)");
  }

  async getStockLevels(): Promise<{ bizimHesapProductId: string; stock: number }[]> {
    throw new BizimHesapNotSupportedError("getStockLevels (gerçek endpoint bekleniyor)");
  }

  async getPrices(): Promise<
    { bizimHesapProductId: string; salePrice: number; purchasePrice?: number }[]
  > {
    throw new BizimHesapNotSupportedError("getPrices (gerçek endpoint bekleniyor)");
  }

  async getCustomer(_id: string): Promise<BHCustomer | null> {
    throw new BizimHesapNotSupportedError("getCustomer (gerçek endpoint bekleniyor)");
  }

  async createOrder(_order: BHOrderInput): Promise<BHOrderResult> {
    throw new BizimHesapNotSupportedError("createOrder (gerçek endpoint bekleniyor)");
  }

  async createInvoice(_bizimHesapOrderId: string): Promise<BHInvoiceResult> {
    throw new BizimHesapNotSupportedError("createInvoice (gerçek endpoint bekleniyor)");
  }
}
