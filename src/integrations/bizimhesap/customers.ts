import "server-only";
import { getBizimHesapAdapter } from "./client";
import { BizimHesapNotSupportedError, type BHCustomer } from "./types";

/**
 * ERP cari/müşteri bilgisini çeker (cari hesap için).
 * API desteklemiyorsa null döner — SAHTE cari hesap üretilmez.
 */
export async function fetchCustomer(
  bizimHesapCustomerId: string,
): Promise<BHCustomer | null> {
  const adapter = getBizimHesapAdapter();
  if (!adapter.getCustomer) return null;
  try {
    return await adapter.getCustomer(bizimHesapCustomerId);
  } catch (err) {
    if (err instanceof BizimHesapNotSupportedError) return null;
    throw err;
  }
}
