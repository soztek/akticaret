"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";

export type ProductFormState = { error?: string; ok?: boolean } | undefined;

const dec = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) return { error: "Yetkiniz yok." };

  const id = String(formData.get("id") ?? "");
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { error: "Ürün bulunamadı." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Ürün adı gerekli." };

  const b2cPrice = dec(formData.get("b2cPrice"));
  const listPrice = dec(formData.get("listPrice"));
  const b2bPrice = dec(formData.get("b2bPrice"));
  const purchasePrice = dec(formData.get("purchasePrice"));
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10) || 0;
  const isActive = formData.get("isActive") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const categoryId = String(formData.get("categoryId") ?? "") || null;

  if (b2cPrice == null || b2cPrice < 0) return { error: "Geçerli bir satış fiyatı girin." };

  await db.product.update({
    where: { id },
    data: {
      name,
      shortDescription: String(formData.get("shortDescription") ?? "") || null,
      b2cPrice: new Prisma.Decimal(b2cPrice),
      listPrice: new Prisma.Decimal(listPrice ?? b2cPrice),
      b2bPrice: b2bPrice != null ? new Prisma.Decimal(b2bPrice) : null,
      purchasePrice: purchasePrice != null ? new Prisma.Decimal(purchasePrice) : null,
      stock,
      isActive,
      isFeatured,
      categoryId,
    },
  });

  // Denetim kaydı
  await db.auditLog.create({
    data: {
      userId: user.id,
      actorName: user.name,
      action: "product.update",
      entityType: "Product",
      entityId: id,
      newValue: { name, b2cPrice, b2bPrice, stock, isActive } as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/admin/urunler");
  revalidatePath(`/urun/${product.slug}`);
  return { ok: true };
}

/** Hızlı aktif/pasif değiştirme (liste içinden). */
export async function toggleProductActive(id: string, next: boolean) {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) return;
  await db.product.update({ where: { id }, data: { isActive: next } });
  revalidatePath("/admin/urunler");
}
