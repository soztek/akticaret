"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { uniqueSlug } from "@/lib/slug";
import { normalizeSearch } from "@/lib/search-normalize";

export type ProductFormState = { error?: string; ok?: boolean } | undefined;

const dec = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** Görsel URL'sini birincil ProductImage olarak ayarla (varsa eskiyi değiştir). */
async function setPrimaryImage(productId: string, imageUrl: string | null) {
  if (!imageUrl) return;
  const existing = await db.productImage.findFirst({
    where: { productId, isPrimary: true },
  });
  if (existing?.url === imageUrl) return;
  await db.productImage.deleteMany({ where: { productId, isPrimary: true } });
  await db.productImage.create({ data: { productId, url: imageUrl, isPrimary: true, sortOrder: 0 } });
}

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
      searchText: normalizeSearch(`${name} ${product.sku ?? ""}`),
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

  await setPrimaryImage(id, String(formData.get("imageUrl") ?? "") || null);

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

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) return { error: "Yetkiniz yok." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Ürün adı gerekli." };

  const b2cPrice = dec(formData.get("b2cPrice"));
  if (b2cPrice == null || b2cPrice <= 0) return { error: "Geçerli bir satış fiyatı girin." };

  const listPrice = dec(formData.get("listPrice"));
  const b2bPrice = dec(formData.get("b2bPrice"));
  const purchasePrice = dec(formData.get("purchasePrice"));
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10) || 0;
  const isActive = formData.get("isActive") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const skuRaw = String(formData.get("sku") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "") || null;

  // SKU benzersizlik kontrolü
  if (skuRaw) {
    const dup = await db.product.findUnique({ where: { sku: skuRaw } });
    if (dup) return { error: `"${skuRaw}" kodu zaten başka bir üründe kullanılıyor.` };
  }

  const slug = await uniqueSlug(name, async (s) =>
    Boolean(await db.product.findUnique({ where: { slug: s } })),
  );

  const product = await db.product.create({
    data: {
      name,
      slug,
      sku: skuRaw,
      searchText: normalizeSearch(`${name} ${skuRaw ?? ""}`),
      shortDescription: String(formData.get("shortDescription") ?? "") || null,
      b2cPrice: new Prisma.Decimal(b2cPrice),
      listPrice: new Prisma.Decimal(listPrice ?? b2cPrice),
      b2bPrice: b2bPrice != null ? new Prisma.Decimal(b2bPrice) : null,
      purchasePrice: purchasePrice != null ? new Prisma.Decimal(purchasePrice) : null,
      stock,
      unit: "adet",
      isActive,
      isFeatured,
      categoryId,
      source: "MANUAL",
    },
  });

  if (imageUrl) {
    await db.productImage.create({ data: { productId: product.id, url: imageUrl, isPrimary: true } });
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      actorName: user.name,
      action: "product.create",
      entityType: "Product",
      entityId: product.id,
      newValue: { name, b2cPrice } as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/admin/urunler");
  redirect(`/admin/urunler/${product.id}`);
}

/** Hızlı aktif/pasif değiştirme (liste içinden). */
export async function toggleProductActive(id: string, next: boolean) {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) return;
  await db.product.update({ where: { id }, data: { isActive: next } });
  revalidatePath("/admin/urunler");
}
