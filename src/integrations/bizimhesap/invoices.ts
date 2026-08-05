import "server-only";
import { getBizimHesapAdapter } from "./client";
import {
  BizimHesapNotSupportedError,
  type BHInvoiceResult,
} from "./types";

export type CreateInvoiceResult =
  | { ok: true; invoice: BHInvoiceResult }
  | { ok: false; supported: boolean; message: string };

/** BİZİM HESAP'ta fatura oluşturur (API destekliyorsa). */
export async function createInvoice(
  bizimHesapOrderId: string,
): Promise<CreateInvoiceResult> {
  const adapter = getBizimHesapAdapter();
  if (!adapter.createInvoice) {
    return {
      ok: false,
      supported: false,
      message: "Bu adapter fatura oluşturmayı desteklemiyor.",
    };
  }
  try {
    return { ok: true, invoice: await adapter.createInvoice(bizimHesapOrderId) };
  } catch (err) {
    if (err instanceof BizimHesapNotSupportedError) {
      return { ok: false, supported: false, message: err.message };
    }
    return {
      ok: false,
      supported: true,
      message: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}
