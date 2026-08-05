// BİZİM HESAP entegrasyon katmanı — genel giriş noktası.
// Frontend bunu DOĞRUDAN çağırmaz: API Route / Server Action -> Service -> buraya.
export * from "./types";
export { getBizimHesapAdapter, getBizimHesapConfig, isLiveConfigured } from "./client";
export {
  syncCategories,
  syncProducts,
  syncStock,
  syncPrices,
  fullSync,
  testConnection,
  type SyncResult,
} from "./sync";
export { pushOrder, type PushOrderResult } from "./orders";
export { createInvoice, type CreateInvoiceResult } from "./invoices";
export { fetchCustomer } from "./customers";
