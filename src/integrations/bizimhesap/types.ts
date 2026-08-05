// ============================================================
// BİZİM HESAP (harici ERP / ön muhasebe) — Domain tipleri ve Adapter arayüzü
// ------------------------------------------------------------
// ÖNEMLİ: Bu katman soyutlamadır. Gerçek Bizim Hesap API endpoint'leri ve
// kimlik bilgileri HENÜZ verilmedi. Endpoint UYDURULMAZ. `live-adapter.ts`
// içindeki gerçek çağrılar resmi API dokümanı gelene kadar TODO'dur.
// ============================================================

/** Bizim Hesap'tan gelen ürün (ERP master alanları). */
export interface BHProduct {
  id: string; // Bizim Hesap ürün ID
  sku?: string; // stok kodu
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  brand?: string;
  purchasePrice?: number; // alış
  salePrice: number; // satış
  vatRate?: number; // KDV %
  stock: number;
  unit?: string; // adet, kg, ...
  imageUrl?: string;
  isActive: boolean;
}

/** Bizim Hesap kategorisi. */
export interface BHCategory {
  id: string;
  name: string;
  parentId?: string;
}

/** Bizim Hesap cari/müşteri. */
export interface BHCustomer {
  id: string;
  name: string;
  taxNumber?: string;
  taxOffice?: string;
  phone?: string;
  email?: string;
  balance?: number; // cari bakiye (varsa)
}

/** Web sitesinden ERP'ye aktarılacak sipariş. */
export interface BHOrderInput {
  websiteOrderId: string;
  orderNumber: string;
  bizimHesapCustomerId?: string;
  customerName: string;
  items: {
    bizimHesapProductId?: string;
    sku?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }[];
  total: number;
}

export interface BHOrderResult {
  bizimHesapOrderId: string;
}

export interface BHInvoiceResult {
  invoiceId: string;
  invoiceUrl?: string;
}

export interface BHConnectionStatus {
  connected: boolean;
  mode: "mock" | "live";
  message: string;
}

/** Bir yeteneğin API tarafından desteklenip desteklenmediği. */
export class BizimHesapNotSupportedError extends Error {
  constructor(capability: string) {
    super(
      `Bizim Hesap API bu yeteneği desteklemiyor veya henüz yapılandırılmadı: ${capability}`,
    );
    this.name = "BizimHesapNotSupportedError";
  }
}

/**
 * Tüm Bizim Hesap adapter'larının uyması gereken arayüz.
 * Mock ve Live adapter bunu uygular. Servis katmanı yalnızca bu arayüzü bilir.
 */
export interface BizimHesapAdapter {
  readonly mode: "mock" | "live";

  testConnection(): Promise<BHConnectionStatus>;

  // Okuma (ERP -> Web)
  listProducts(params?: { page?: number; pageSize?: number }): Promise<{
    items: BHProduct[];
    hasMore: boolean;
  }>;
  listCategories(): Promise<BHCategory[]>;
  getStockLevels(): Promise<{ bizimHesapProductId: string; stock: number }[]>;
  getPrices(): Promise<
    { bizimHesapProductId: string; salePrice: number; purchasePrice?: number }[]
  >;

  // Cari (destekleniyorsa)
  getCustomer?(bizimHesapCustomerId: string): Promise<BHCustomer | null>;

  // Yazma (Web -> ERP) — API destekliyorsa
  createOrder?(order: BHOrderInput): Promise<BHOrderResult>;
  createInvoice?(bizimHesapOrderId: string): Promise<BHInvoiceResult>;
}
