import "server-only";
import { getBizimHesapAdapter } from "./client";

/** ERP'deki güncel stok seviyelerini çeker. */
export async function fetchStockLevels() {
  return getBizimHesapAdapter().getStockLevels();
}

/** ERP'deki güncel fiyatları çeker. */
export async function fetchPrices() {
  return getBizimHesapAdapter().getPrices();
}
