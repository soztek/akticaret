import "server-only";
import { getBizimHesapAdapter } from "./client";
import type { BHProduct } from "./types";

/** ERP'deki tüm ürünleri sayfalayarak çeker. */
export async function fetchAllProducts(): Promise<BHProduct[]> {
  const adapter = getBizimHesapAdapter();
  const all: BHProduct[] = [];
  let page = 1;
  const pageSize = 100;
  // Güvenlik: sonsuz döngüyü önlemek için üst sınır.
  const MAX_PAGES = 1000;
  while (page <= MAX_PAGES) {
    const { items, hasMore } = await adapter.listProducts({ page, pageSize });
    all.push(...items);
    if (!hasMore || items.length === 0) break;
    page++;
  }
  return all;
}
