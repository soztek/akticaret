"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { importProductsFromBuffer, type ImportReport } from "@/lib/import/product-import";

export type { ImportReport, ImportRowError } from "@/lib/import/product-import";

export async function importProducts(
  _prev: ImportReport | undefined,
  formData: FormData,
): Promise<ImportReport> {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) return { error: "Yetkiniz yok." };

  const dryRun = String(formData.get("dryRun") ?? "1") === "1";
  const file = formData.get("file");
  if (!file || typeof file === "string" || (file as File).size === 0) {
    return { error: "Lütfen bir Excel/CSV dosyası seçin." };
  }
  if ((file as File).size > 10 * 1024 * 1024) {
    return { error: "Dosya çok büyük (en fazla 10 MB)." };
  }

  const buf = Buffer.from(await (file as File).arrayBuffer());
  const report = await importProductsFromBuffer(buf, {
    dryRun,
    userId: user.id,
    userName: user.name,
  });

  if (!dryRun && report.ok && ((report.created ?? 0) > 0 || (report.updated ?? 0) > 0)) {
    revalidatePath("/admin/urunler");
    revalidatePath("/admin/stok");
  }

  return report;
}
