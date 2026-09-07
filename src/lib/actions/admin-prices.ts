"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";

export type PriceField = "b2cPrice" | "b2bPrice" | "listPrice";
export type BulkOp = "percent" | "amount" | "margin";
export type Rounding = "none" | "integer" | "x90" | "x95";

export type BulkPriceInput = {
  categoryId: string; // "ALL" veya kategori id
  includeSubcategories: boolean;
  fields: PriceField[];
  op: BulkOp;
  value: number; // percent: +/-% · amount: +/- TL · margin: marj yüzdesi
  rounding: Rounding;
  dryRun: boolean;
};

export type PriceChange = {
  name: string;
  sku: string | null;
  before: Partial<Record<PriceField, number>>;
  after: Partial<Record<PriceField, number>>;
};

export type BulkPriceReport = {
  ok?: boolean;
  error?: string;
  dryRun?: boolean;
  affected?: number;
  skipped?: number;
  sample?: PriceChange[];
};

function roundPrice(n: number, mode: Rounding): number {
  if (!Number.isFinite(n) || n < 0) n = 0;
  if (mode === "integer") return Math.round(n);
  if (mode === "x90") return Math.floor(n) + 0.9;
  if (mode === "x95") return Math.floor(n) + 0.95;
  return Math.round(n * 100) / 100;
}

/** Seçili kategori + (opsiyonel) tüm alt kategori id'leri. */
async function resolveCategoryIds(categoryId: string, includeSub: boolean): Promise<string[]> {
  if (!includeSub) return [categoryId];
  const all = await db.category.findMany({ select: { id: true, parentId: true } });
  const childrenOf = new Map<string, string[]>();
  for (const c of all) {
    if (c.parentId) {
      const arr = childrenOf.get(c.parentId) ?? [];
      arr.push(c.id);
      childrenOf.set(c.parentId, arr);
    }
  }
  const result: string[] = [];
  const stack = [categoryId];
  while (stack.length) {
    const id = stack.pop()!;
    result.push(id);
    for (const ch of childrenOf.get(id) ?? []) stack.push(ch);
  }
  return result;
}

export async function bulkUpdatePrices(input: BulkPriceInput): Promise<BulkPriceReport> {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) return { error: "Yetkiniz yok." };

  if (!input.fields || input.fields.length === 0) {
    return { error: "En az bir fiyat alanı seçin." };
  }
  if (!Number.isFinite(input.value)) {
    return { error: "Geçerli bir değer girin." };
  }
  if (input.op === "margin" && input.value < 0) {
    return { error: "Marj yüzdesi negatif olamaz." };
  }

  const where: Prisma.ProductWhereInput = {};
  if (input.categoryId !== "ALL") {
    const ids = await resolveCategoryIds(input.categoryId, input.includeSubcategories);
    where.categoryId = { in: ids };
  }

  const products = await db.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      b2cPrice: true,
      b2bPrice: true,
      listPrice: true,
      purchasePrice: true,
    },
  });

  if (products.length === 0) {
    return { ok: true, dryRun: input.dryRun, affected: 0, skipped: 0, sample: [] };
  }

  const sample: PriceChange[] = [];
  let affected = 0;
  let skipped = 0;
  const updates: { id: string; data: Prisma.ProductUpdateInput }[] = [];

  for (const p of products) {
    const before: Partial<Record<PriceField, number>> = {};
    const after: Partial<Record<PriceField, number>> = {};
    const data: Prisma.ProductUpdateInput = {};
    let changedAny = false;

    // Marj işlemi için taban: alış fiyatı
    if (input.op === "margin" && p.purchasePrice == null) {
      skipped++;
      continue;
    }

    for (const field of input.fields) {
      const current = p[field] != null ? Number(p[field]) : null;
      let next: number | null = null;

      if (input.op === "percent") {
        if (current == null) continue;
        next = current * (1 + input.value / 100);
      } else if (input.op === "amount") {
        if (current == null) continue;
        next = current + input.value;
      } else {
        // margin: alış × (1 + marj%)
        const base = Number(p.purchasePrice);
        next = base * (1 + input.value / 100);
      }

      next = roundPrice(next, input.rounding);
      if (current == null || Math.abs(next - current) > 0.001) {
        before[field] = current ?? 0;
        after[field] = next;
        data[field] = new Prisma.Decimal(next);
        changedAny = true;
      }
    }

    if (changedAny) {
      affected++;
      updates.push({ id: p.id, data });
      if (sample.length < 15) sample.push({ name: p.name, sku: p.sku, before, after });
    } else {
      skipped++;
    }
  }

  if (!input.dryRun && updates.length > 0) {
    // 200'lük gruplar halinde uygula
    for (let i = 0; i < updates.length; i += 200) {
      const chunk = updates.slice(i, i + 200);
      await db.$transaction(chunk.map((u) => db.product.update({ where: { id: u.id }, data: u.data })));
    }
    await db.auditLog.create({
      data: {
        userId: user.id,
        actorName: user.name,
        action: "product.bulkPrice",
        entityType: "Product",
        entityId: input.categoryId,
        newValue: {
          op: input.op,
          value: input.value,
          fields: input.fields,
          rounding: input.rounding,
          affected,
        } as Prisma.InputJsonValue,
      },
    });
    revalidatePath("/admin/urunler");
  }

  return { ok: true, dryRun: input.dryRun, affected, skipped, sample };
}

// ---------- Ürün bazlı ----------

export type PricingRow = {
  id: string;
  name: string;
  sku: string | null;
  categoryName: string | null;
  b2cPrice: number;
  b2bPrice: number | null;
  listPrice: number;
};

export async function searchProductsForPricing(
  query: string,
  categoryId: string,
): Promise<PricingRow[]> {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) return [];

  const where: Prisma.ProductWhereInput = {};
  const q = query.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { searchText: { contains: q.toLowerCase() } },
    ];
  }
  if (categoryId && categoryId !== "ALL") where.categoryId = categoryId;

  const rows = await db.product.findMany({
    where,
    orderBy: { name: "asc" },
    take: 60,
    select: {
      id: true,
      name: true,
      sku: true,
      b2cPrice: true,
      b2bPrice: true,
      listPrice: true,
      category: { select: { name: true } },
    },
  });

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    categoryName: p.category?.name ?? null,
    b2cPrice: Number(p.b2cPrice),
    b2bPrice: p.b2bPrice != null ? Number(p.b2bPrice) : null,
    listPrice: Number(p.listPrice),
  }));
}

export type SavePriceInput = {
  id: string;
  b2cPrice: number;
  b2bPrice: number | null;
  listPrice: number;
};

export async function updateProductPrices(
  input: SavePriceInput,
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) return { error: "Yetkiniz yok." };

  if (!Number.isFinite(input.b2cPrice) || input.b2cPrice <= 0) {
    return { error: "Geçerli bir satış fiyatı girin." };
  }

  await db.product.update({
    where: { id: input.id },
    data: {
      b2cPrice: new Prisma.Decimal(input.b2cPrice),
      listPrice: new Prisma.Decimal(Number.isFinite(input.listPrice) && input.listPrice > 0 ? input.listPrice : input.b2cPrice),
      b2bPrice: input.b2bPrice != null && Number.isFinite(input.b2bPrice) ? new Prisma.Decimal(input.b2bPrice) : null,
    },
  });

  revalidatePath("/admin/urunler");
  return { ok: true };
}
