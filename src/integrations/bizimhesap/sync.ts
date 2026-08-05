import "server-only";
import { Prisma, type SyncType } from "@prisma/client";
import { db } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";
import { getBizimHesapAdapter } from "./client";
import { fetchAllProducts } from "./products";
import { fetchAllCategories } from "./categories";
import { fetchStockLevels, fetchPrices } from "./stock";
import type { BHProduct } from "./types";

// ============================================================
// SENKRONİZASYON SERVİSİ
// ------------------------------------------------------------
// - Her çalıştırma bir SyncJob oluşturur; sonuç + hatalar loglanır.
// - Dedup: BizimHesap*Mapping tabloları ile aynı kayıt İKİ KEZ oluşmaz.
// - Alan sahipliği (spec §56): ERP alanları (ad/SKU/barkod/stok/fiyat/kategori)
//   güncellenir; WEB alanları (SEO/görsel/detaylı açıklama/öne çıkan/video)
//   senkronda ASLA ezilmez.
// ============================================================

export interface SyncResult {
  jobId: string;
  totalRead: number;
  created: number;
  updated: number;
  failed: number;
}

async function log(
  jobId: string,
  level: "INFO" | "WARN" | "ERROR",
  message: string,
) {
  await db.syncLog.create({ data: { jobId, level, message } });
}

async function recordError(
  jobId: string,
  entityType: string,
  entityRef: string | undefined,
  message: string,
  payload?: unknown,
) {
  await db.syncError.create({
    data: {
      jobId,
      entityType,
      entityRef,
      message,
      payload: payload ? (payload as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function startJob(type: SyncType, triggeredBy: "MANUAL" | "CRON") {
  return db.syncJob.create({
    data: { type, triggeredBy, status: "RUNNING", startedAt: new Date() },
  });
}

async function finishJob(
  jobId: string,
  stats: { totalRead: number; created: number; updated: number; failed: number },
) {
  const status =
    stats.failed === 0
      ? "SUCCESS"
      : stats.failed < stats.totalRead
        ? "PARTIAL"
        : "FAILED";
  await db.syncJob.update({
    where: { id: jobId },
    data: { ...stats, status, finishedAt: new Date() },
  });
}

// ---------- Yardımcılar ----------

async function upsertBrand(name?: string): Promise<string | null> {
  if (!name) return null;
  const slug = slugify(name);
  const brand = await db.brand.upsert({
    where: { slug },
    update: {},
    create: { name, slug },
  });
  return brand.id;
}

/** BH kategori ID'sinden web kategorisini bulur/oluşturur (mapping ile). */
async function resolveCategory(
  bhCategoryId?: string,
  bhCategoryName?: string,
): Promise<string | null> {
  if (!bhCategoryId) return null;
  const mapping = await db.bizimHesapCategoryMapping.findFirst({
    where: { bizimHesapCategoryId: bhCategoryId },
    include: { category: true },
  });
  if (mapping) return mapping.websiteCategoryId;

  // Mapping yoksa isimden oluştur (kategori senkronu çalışmadıysa yedek).
  const name = bhCategoryName ?? "Diğer";
  const slug = await uniqueSlug(name, async (s) =>
    Boolean(await db.category.findUnique({ where: { slug: s } })),
  );
  const category = await db.category.create({ data: { name, slug } });
  await db.bizimHesapCategoryMapping.create({
    data: {
      websiteCategoryId: category.id,
      bizimHesapCategoryId: bhCategoryId,
      syncStatus: "SYNCED",
      lastSyncedAt: new Date(),
    },
  });
  return category.id;
}

// ---------- Kategori senkronu ----------

export async function syncCategories(
  triggeredBy: "MANUAL" | "CRON" = "MANUAL",
): Promise<SyncResult> {
  const job = await startJob("CATEGORIES", triggeredBy);
  let created = 0,
    updated = 0,
    failed = 0,
    totalRead = 0;

  try {
    const categories = await fetchAllCategories();
    totalRead = categories.length;
    await log(job.id, "INFO", `${totalRead} kategori okundu.`);

    for (const bh of categories) {
      try {
        const existing = await db.bizimHesapCategoryMapping.findFirst({
          where: { bizimHesapCategoryId: bh.id },
        });
        if (existing) {
          // Sadece ERP alanı: ad. WEB alanları (SEO/görsel/banner) korunur.
          await db.category.update({
            where: { id: existing.websiteCategoryId },
            data: { name: bh.name },
          });
          await db.bizimHesapCategoryMapping.update({
            where: { id: existing.id },
            data: { lastSyncedAt: new Date(), syncStatus: "SYNCED" },
          });
          updated++;
        } else {
          const slug = await uniqueSlug(bh.name, async (s) =>
            Boolean(await db.category.findUnique({ where: { slug: s } })),
          );
          const category = await db.category.create({
            data: { name: bh.name, slug },
          });
          await db.bizimHesapCategoryMapping.create({
            data: {
              websiteCategoryId: category.id,
              bizimHesapCategoryId: bh.id,
              syncStatus: "SYNCED",
              lastSyncedAt: new Date(),
            },
          });
          created++;
        }
      } catch (err) {
        failed++;
        await recordError(
          job.id,
          "CATEGORY",
          bh.id,
          err instanceof Error ? err.message : "hata",
          bh,
        );
      }
    }
  } catch (err) {
    await log(
      job.id,
      "ERROR",
      `Kategori senkronu başarısız: ${err instanceof Error ? err.message : err}`,
    );
  }

  await finishJob(job.id, { totalRead, created, updated, failed });
  return { jobId: job.id, totalRead, created, updated, failed };
}

// ---------- Ürün senkronu ----------

async function upsertProduct(bh: BHProduct): Promise<"created" | "updated"> {
  const brandId = await upsertBrand(bh.brand);
  const categoryId = await resolveCategory(bh.categoryId, bh.categoryName);

  const mapping = await db.bizimHesapProductMapping.findFirst({
    where: { bizimHesapProductId: bh.id },
  });

  // ERP sahipli alanlar — hem create hem update'te set edilir.
  const erpFields = {
    name: bh.name,
    sku: bh.sku ?? null,
    barcode: bh.barcode ?? null,
    brandId,
    categoryId,
    purchasePrice: bh.purchasePrice != null ? new Prisma.Decimal(bh.purchasePrice) : null,
    listPrice: new Prisma.Decimal(bh.salePrice),
    b2cPrice: new Prisma.Decimal(bh.salePrice),
    vatRate: bh.vatRate ?? 20,
    stock: bh.stock,
    unit: bh.unit ?? "adet",
    isActive: bh.isActive,
  };

  if (mapping) {
    // UPDATE: yalnızca ERP alanları. WEB alanları (seo/görsel/description/
    // isFeatured/videoUrl/b2bPrice) DOKUNULMAZ.
    await db.product.update({
      where: { id: mapping.websiteProductId },
      data: erpFields,
    });
    await db.bizimHesapProductMapping.update({
      where: { id: mapping.id },
      data: { lastSyncedAt: new Date(), syncStatus: "SYNCED", syncError: null },
    });
    return "updated";
  }

  // CREATE: ERP alanları + web varsayılanları.
  const slug = await uniqueSlug(bh.name, async (s) =>
    Boolean(await db.product.findUnique({ where: { slug: s } })),
  );
  const product = await db.product.create({
    data: {
      ...erpFields,
      slug,
      shortDescription: bh.description ?? null,
      source: "BIZIMHESAP",
    },
  });
  await db.bizimHesapProductMapping.create({
    data: {
      websiteProductId: product.id,
      bizimHesapProductId: bh.id,
      syncStatus: "SYNCED",
      lastSyncedAt: new Date(),
    },
  });
  return "created";
}

export async function syncProducts(
  triggeredBy: "MANUAL" | "CRON" = "MANUAL",
): Promise<SyncResult> {
  const job = await startJob("PRODUCTS", triggeredBy);
  let created = 0,
    updated = 0,
    failed = 0,
    totalRead = 0;

  try {
    const products = await fetchAllProducts();
    totalRead = products.length;
    await log(job.id, "INFO", `${totalRead} ürün okundu.`);

    for (const bh of products) {
      try {
        const result = await upsertProduct(bh);
        result === "created" ? created++ : updated++;
      } catch (err) {
        failed++;
        await recordError(
          job.id,
          "PRODUCT",
          bh.id,
          err instanceof Error ? err.message : "hata",
          { id: bh.id, sku: bh.sku, name: bh.name },
        );
      }
    }
  } catch (err) {
    await log(
      job.id,
      "ERROR",
      `Ürün senkronu başarısız: ${err instanceof Error ? err.message : err}`,
    );
  }

  await finishJob(job.id, { totalRead, created, updated, failed });
  return { jobId: job.id, totalRead, created, updated, failed };
}

// ---------- Stok senkronu ----------

export async function syncStock(
  triggeredBy: "MANUAL" | "CRON" = "MANUAL",
): Promise<SyncResult> {
  const job = await startJob("STOCK", triggeredBy);
  let updated = 0,
    failed = 0,
    totalRead = 0;

  try {
    const levels = await fetchStockLevels();
    totalRead = levels.length;
    for (const lvl of levels) {
      try {
        const mapping = await db.bizimHesapProductMapping.findFirst({
          where: { bizimHesapProductId: lvl.bizimHesapProductId },
        });
        if (!mapping) continue;
        await db.product.update({
          where: { id: mapping.websiteProductId },
          data: { stock: lvl.stock },
        });
        updated++;
      } catch (err) {
        failed++;
        await recordError(
          job.id,
          "STOCK",
          lvl.bizimHesapProductId,
          err instanceof Error ? err.message : "hata",
        );
      }
    }
  } catch (err) {
    await log(
      job.id,
      "ERROR",
      `Stok senkronu başarısız: ${err instanceof Error ? err.message : err}`,
    );
  }

  await finishJob(job.id, { totalRead, created: 0, updated, failed });
  return { jobId: job.id, totalRead, created: 0, updated, failed };
}

// ---------- Fiyat senkronu ----------

export async function syncPrices(
  triggeredBy: "MANUAL" | "CRON" = "MANUAL",
): Promise<SyncResult> {
  const job = await startJob("PRICES", triggeredBy);
  let updated = 0,
    failed = 0,
    totalRead = 0;

  try {
    const prices = await fetchPrices();
    totalRead = prices.length;
    for (const p of prices) {
      try {
        const mapping = await db.bizimHesapProductMapping.findFirst({
          where: { bizimHesapProductId: p.bizimHesapProductId },
        });
        if (!mapping) continue;
        await db.product.update({
          where: { id: mapping.websiteProductId },
          data: {
            listPrice: new Prisma.Decimal(p.salePrice),
            b2cPrice: new Prisma.Decimal(p.salePrice),
            purchasePrice:
              p.purchasePrice != null ? new Prisma.Decimal(p.purchasePrice) : undefined,
          },
        });
        updated++;
      } catch (err) {
        failed++;
        await recordError(
          job.id,
          "PRICE",
          p.bizimHesapProductId,
          err instanceof Error ? err.message : "hata",
        );
      }
    }
  } catch (err) {
    await log(
      job.id,
      "ERROR",
      `Fiyat senkronu başarısız: ${err instanceof Error ? err.message : err}`,
    );
  }

  await finishJob(job.id, { totalRead, created: 0, updated, failed });
  return { jobId: job.id, totalRead, created: 0, updated, failed };
}

// ---------- Tam senkron ----------

export async function fullSync(
  triggeredBy: "MANUAL" | "CRON" = "MANUAL",
): Promise<{ categories: SyncResult; products: SyncResult; stock: SyncResult }> {
  // Sıra önemli: önce kategori (mapping oluşsun), sonra ürün, sonra stok.
  const categories = await syncCategories(triggeredBy);
  const products = await syncProducts(triggeredBy);
  const stock = await syncStock(triggeredBy);
  return { categories, products, stock };
}

/** Bağlantı testi (adapter'a delege). */
export async function testConnection() {
  return getBizimHesapAdapter().testConnection();
}
