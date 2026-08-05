import "server-only";
import { getBizimHesapAdapter } from "./client";
import {
  BizimHesapNotSupportedError,
  type BHOrderInput,
  type BHOrderResult,
} from "./types";

export type PushOrderResult =
  | { ok: true; bizimHesapOrderId: string }
  | { ok: false; supported: boolean; message: string };

/**
 * Web sitesi siparişini BİZİM HESAP'a aktarır (API destekliyorsa).
 * Desteklenmiyorsa sipariş kaybolmaz — çağıran taraf sonucu loglar ve
 * admin panelinde "Bizim Hesap'a aktarılamadı" durumu gösterir.
 */
export async function pushOrder(
  order: BHOrderInput,
): Promise<PushOrderResult> {
  const adapter = getBizimHesapAdapter();
  if (!adapter.createOrder) {
    return {
      ok: false,
      supported: false,
      message: "Bu adapter sipariş aktarımını desteklemiyor.",
    };
  }
  try {
    const res: BHOrderResult = await adapter.createOrder(order);
    return { ok: true, bizimHesapOrderId: res.bizimHesapOrderId };
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
