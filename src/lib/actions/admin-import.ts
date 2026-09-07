"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { uniqueSlug } from "@/lib/slug";
import { normalizeSearch } from "@/lib/search-normalize";

export type ImportRowError = { row: number; sku: string; reason: string };

export type ImportReport = {
  ok?: boolean;
  error?: string;
  dryRun?: boolean;
  totalRows?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: ImportRowError[];
  missingCategories?: string[];
  createdBrands?: string[];
};

/** Türkçe karakterleri ASCII'ye indirger + küçük harf + boşluk sadeleştirir. */
function fold(s: unknown): string {
  return String(s ?? "")
    .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
    .replace(/Ş/g, "s").replace(/ş/g, "s")
    .replace(/Ğ/g, "g").replace(/ğ/g, "g")
    .replace(/Ü/g, "u").replace(/ü/g, "u")
    .replace(/Ö/g, "o").replace(/ö/g, "o")
    .replace(/Ç/g, "c").replace(/ç/g, "c")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Başlık takma adları → kanonik alan (hepsi fold edilmiş halde). */
const FIELD_ALIASES: Record<string, string[]> = {
  sku: ["sku", "stok kodu", "stokkodu", "kod", "urun kodu", "stok no", "stok numarasi"],
  name: ["urun adi", "ad", "urun", "urun ismi", "isim", "name", "urun adı"],
  barcode: ["barkod", "barcode"],
  category: ["kategori", "category", "kategori adi"],
  brand: ["marka", "brand"],
  listPrice: ["liste fiyati", "liste", "list price", "liste fiyat"],
  b2cPrice: ["satis fiyati", "b2c", "fiyat", "perakende", "satis", "price", "perakende fiyat", "satis fiyat"],
  b2bPrice: ["bayi fiyati", "bayi", "b2b", "toptan", "bayi fiyat"],
  purchasePrice: ["alis fiyati", "alis", "maliyet", "purchase", "alis fiyat"],
  vatRate: ["kdv", "kdv orani", "vat", "kdv %"],
  stock: ["stok", "stok adedi", "adet", "miktar", "stock", "qty", "quantity"],
  unit: ["birim", "unit"],
  shortDescription: ["kisa aciklama", "aciklama", "description"],
  isActive: ["aktif", "durum", "active"],
};

/** "1.234,56" / "1234.56" / "₺1.200" → number | null */
function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v).trim().replace(/\s/g, "").replace(/₺|tl/gi, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function intVal(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}

function boolVal(v: unknown): boolean | undefined {
  if (v == null || v === "") return undefined;
  const f = fold(v);
  if (["evet", "aktif", "1", "true", "yes", "x", "var", "e"].includes(f)) return true;
  if (["hayir", "pasif", "0", "false", "no", "yok", "h"].includes(f)) return false;
  return undefined;
}

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

  // --- Dosyayı oku ---
  let aoa: unknown[][];
  try {
    const buf = Buffer.from(await (file as File).arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer", cellDates: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return { error: "Dosyada okunacak sayfa bulunamadı." };
    aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: "" });
  } catch {
    return { error: "Dosya okunamadı. Geçerli bir .xlsx veya .csv olduğundan emin olun." };
  }
  if (aoa.length < 2) return { error: "Dosyada başlık satırı + en az bir veri satırı olmalı." };

  // --- Başlıkları eşle ---
  const headers = (aoa[0] as unknown[]).map((h) => fold(h));
  const colField: Record<number, string> = {};
  headers.forEach((h, i) => {
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(h)) {
        colField[i] = field;
        break;
      }
    }
  });
  const fields = new Set(Object.values(colField));
  if (!fields.has("sku")) {
    return { error: "SKU sütunu bulunamadı. Başlık satırında 'SKU' veya 'Stok Kodu' olmalı." };
  }

  // --- Referans verileri önden yükle ---
  const [cats, brandRows, prods] = await Promise.all([
    db.category.findMany({ select: { id: true, name: true } }),
    db.brand.findMany({ select: { id: true, name: true } }),
    db.product.findMany({ where: { sku: { not: null } }, select: { id: true, sku: true, stock: true } }),
  ]);
  const catByName = new Map(cats.map((c) => [fold(c.name), c.id]));
  const brandByName = new Map(brandRows.map((b) => [fold(b.name), b.id]));
  const bySku = new Map(prods.map((p) => [p.sku!.trim(), { id: p.id, stock: p.stock }]));

  const errors: ImportRowError[] = [];
  const missingCategories: string[] = [];
  const createdBrands: string[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const resolveCat = (raw: unknown): string | null => {
    const name = String(raw ?? "").trim();
    if (!name) return null;
    const id = catByName.get(fold(name));
    if (!id) {
      if (!missingCategories.includes(name)) missingCategories.push(name);
      return null;
    }
    return id;
  };

  const resolveBrand = async (raw: unknown): Promise<string | null> => {
    const name = String(raw ?? "").trim();
    if (!name) return null;
    const f = fold(name);
    const found = brandByName.get(f);
    if (found) return found;
    if (!createdBrands.includes(name)) createdBrands.push(name);
    if (dryRun) return null;
    const slug = await uniqueSlug(name, async (s) =>
      Boolean(await db.brand.findUnique({ where: { slug: s } })),
    );
    const b = await db.brand.create({ data: { name, slug } });
    brandByName.set(f, b.id);
    return b.id;
  };

  const totalRows = aoa.length - 1;

  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] as unknown[];
    const rowNo = r + 1; // Excel satır numarası (başlık dahil)
    const rec: Record<string, unknown> = {};
    for (const [i, f] of Object.entries(colField)) rec[f] = row[Number(i)];

    const sku = String(rec.sku ?? "").trim();
    if (!sku) {
      errors.push({ row: rowNo, sku: "", reason: "SKU boş" });
      skipped++;
      continue;
    }

    try {
      const existing = bySku.get(sku);

      if (existing) {
        // --- GÜNCELLE ---
        const data: Prisma.ProductUpdateInput = {};
        const name = String(rec.name ?? "").trim();
        if (name) {
          data.name = name;
          data.searchText = normalizeSearch(`${name} ${sku}`);
        }
        const barcode = String(rec.barcode ?? "").trim();
        if (barcode) data.barcode = barcode;
        const b2c = num(rec.b2cPrice);
        if (b2c != null) data.b2cPrice = new Prisma.Decimal(b2c);
        const list = num(rec.listPrice);
        if (list != null) data.listPrice = new Prisma.Decimal(list);
        const b2b = num(rec.b2bPrice);
        if (b2b != null) data.b2bPrice = new Prisma.Decimal(b2b);
        const purchase = num(rec.purchasePrice);
        if (purchase != null) data.purchasePrice = new Prisma.Decimal(purchase);
        const vat = intVal(rec.vatRate);
        if (vat != null) data.vatRate = vat;
        const unit = String(rec.unit ?? "").trim();
        if (unit) data.unit = unit;
        const shortDesc = String(rec.shortDescription ?? "").trim();
        if (shortDesc) data.shortDescription = shortDesc;
        const active = boolVal(rec.isActive);
        if (active != null) data.isActive = active;
        if (fields.has("category")) {
          const catId = resolveCat(rec.category);
          if (catId) data.category = { connect: { id: catId } };
        }
        if (fields.has("brand")) {
          const brandId = await resolveBrand(rec.brand);
          if (brandId) data.brand = { connect: { id: brandId } };
        }

        const newStock = intVal(rec.stock);
        const stockChanged = newStock != null && newStock !== existing.stock;
        if (newStock != null) data.stock = newStock;

        if (!dryRun) {
          await db.product.update({ where: { id: existing.id }, data });
          if (stockChanged) {
            await db.stockMovement.create({
              data: {
                productId: existing.id,
                type: "ADJUST",
                quantity: newStock! - existing.stock,
                reason: "Excel içe aktarma",
                source: "MANUAL",
                createdById: user.id,
              },
            });
          }
        }
        updated++;
      } else {
        // --- OLUŞTUR ---
        const name = String(rec.name ?? "").trim();
        if (!name) {
          errors.push({ row: rowNo, sku, reason: "Yeni ürün için 'Ürün Adı' gerekli" });
          skipped++;
          continue;
        }
        const b2c = num(rec.b2cPrice) ?? num(rec.listPrice);
        if (b2c == null || b2c <= 0) {
          errors.push({ row: rowNo, sku, reason: "Yeni ürün için geçerli satış fiyatı gerekli" });
          skipped++;
          continue;
        }
        const list = num(rec.listPrice) ?? b2c;
        const b2b = num(rec.b2bPrice);
        const purchase = num(rec.purchasePrice);
        const vat = intVal(rec.vatRate);
        const stock = intVal(rec.stock) ?? 0;
        const unit = String(rec.unit ?? "").trim() || "adet";
        const barcode = String(rec.barcode ?? "").trim() || null;
        const shortDesc = String(rec.shortDescription ?? "").trim() || null;
        const active = boolVal(rec.isActive);
        const categoryId = fields.has("category") ? resolveCat(rec.category) : null;
        const brandId = fields.has("brand") ? await resolveBrand(rec.brand) : null;

        if (!dryRun) {
          const slug = await uniqueSlug(name, async (s) =>
            Boolean(await db.product.findUnique({ where: { slug: s } })),
          );
          const p = await db.product.create({
            data: {
              name,
              slug,
              sku,
              barcode,
              searchText: normalizeSearch(`${name} ${sku}`),
              shortDescription: shortDesc,
              b2cPrice: new Prisma.Decimal(b2c),
              listPrice: new Prisma.Decimal(list),
              b2bPrice: b2b != null ? new Prisma.Decimal(b2b) : null,
              purchasePrice: purchase != null ? new Prisma.Decimal(purchase) : null,
              vatRate: vat ?? 20,
              stock,
              unit,
              isActive: active ?? true,
              categoryId,
              brandId,
              source: "MANUAL",
            },
          });
          if (stock > 0) {
            await db.stockMovement.create({
              data: {
                productId: p.id,
                type: "IN",
                quantity: stock,
                reason: "Excel içe aktarma (yeni ürün)",
                source: "MANUAL",
                createdById: user.id,
              },
            });
          }
          bySku.set(sku, { id: p.id, stock });
        } else {
          // Aynı dosyada tekrar eden SKU'yu ikinci kez "yeni" saymamak için işaretle
          bySku.set(sku, { id: "yeni", stock });
        }
        created++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
      errors.push({ row: rowNo, sku, reason: msg.slice(0, 160) });
      skipped++;
    }
  }

  if (!dryRun && (created > 0 || updated > 0)) {
    await db.auditLog.create({
      data: {
        userId: user.id,
        actorName: user.name,
        action: "product.import",
        entityType: "Product",
        entityId: "bulk",
        newValue: { created, updated, skipped, totalRows } as Prisma.InputJsonValue,
      },
    });
    revalidatePath("/admin/urunler");
    revalidatePath("/admin/stok");
  }

  return {
    ok: true,
    dryRun,
    totalRows,
    created,
    updated,
    skipped,
    errors: errors.slice(0, 100),
    missingCategories,
    createdBrands,
  };
}
