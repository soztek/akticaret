import "server-only";
import { getBizimHesapAdapter } from "./client";
import type { BHCategory } from "./types";

/** ERP'deki tüm kategorileri çeker. */
export async function fetchAllCategories(): Promise<BHCategory[]> {
  return getBizimHesapAdapter().listCategories();
}
