// 2M Kale → AK Ticaret içe aktarma
// data/kale/{categories,products}.json → veritabanı (DATABASE_URL neyse orası).
// Çalıştırma: node --env-file=.env scripts/kale-import.mjs
// Kâr marjı: KALE_MARKUP (varsayılan 1.30 = %30). Fiyatlar KDV hariç.

import { PrismaClient, Prisma } from "@prisma/client";
import { readFileSync } from "fs";

const TR = { ç:"c",Ç:"c",ğ:"g",Ğ:"g",ı:"i",İ:"i",ö:"o",Ö:"o",ş:"s",Ş:"s",ü:"u",Ü:"u" };
function slugify(input) {
  return (input || "").split("").map((ch) => TR[ch] ?? ch).join("")
    .toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/^-+|-+$/g, "");
}

const db = new PrismaClient();
const MARKUP = Number(process.env.KALE_MARKUP || 1.3);
const OUT = "data/kale";

// Kategori adına göre lucide ikon (kaba eşleme)
function iconFor(name) {
  const n = name.toLowerCase();
  if (/elektrik.*alet|matkap|taşlama|vidalama/.test(n)) return "Drill";
  if (/elektrik/.test(n)) return "Zap";
  if (/boya/.test(n)) return "PaintRoller";
  if (/hırdavat|nalburiye|civata|somun|vida/.test(n)) return "Wrench";
  if (/tesisat|su|boru|batarya/.test(n)) return "Droplets";
  if (/kimyasal|silikon|köpük|yapıştırıcı/.test(n)) return "FlaskConical";
  if (/alçıpan|alçı|profil/.test(n)) return "Layers";
  if (/izolasyon|yalıtım/.test(n)) return "Layers";
  if (/ölçü|metre|terazi/.test(n)) return "Ruler";
  if (/zirai|bahçe/.test(n)) return "Sprout";
  if (/seramik|fayans/.test(n)) return "Grid2x2";
  if (/güvenlik|baret|eldiven|ayakkabı/.test(n)) return "HardHat";
  if (/el alet/.test(n)) return "Hammer";
  return "Package";
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

async function main() {
  const cats = JSON.parse(readFileSync(`${OUT}/categories.json`, "utf8"));
  const products = JSON.parse(readFileSync(`${OUT}/products.json`, "utf8"));
  console.log(`Girdi: ${cats.length} kategori, ${products.length} ürün. Marj: %${Math.round((MARKUP - 1) * 100)}`);

  // Guard: zaten yüklüyse tekrar etme (deploy/build güvenliği). Zorla: FORCE_REIMPORT=1
  const existing = await db.product.count();
  if (existing >= 3000 && process.env.FORCE_REIMPORT !== "1") {
    console.log(`⏭ ${existing} ürün zaten mevcut — import atlandı (FORCE_REIMPORT=1 ile zorla).`);
    return;
  }

  // 1) Katalog temizliği (kullanıcı/ayar/yetki KORUNUR; hero banner KORUNUR)
  await db.productImage.deleteMany();
  await db.bizimHesapProductMapping.deleteMany();
  await db.bizimHesapCategoryMapping.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  console.log("✔ Eski katalog temizlendi.");

  // 2) Kategoriler — benzersiz slug + ikon; iki geçiş (önce oluştur, sonra parent bağla)
  const usedSlug = new Set();
  const uslug = (name, id) => {
    let base = slugify(name) || "kategori";
    let s = base;
    let i = 2;
    while (usedSlug.has(s)) s = `${base}-${i++}`;
    usedSlug.add(s);
    return s;
  };
  const idMap = new Map(); // supplierCatId -> newCatId
  // sortOrder: kök kategoriler önce
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i];
    const created = await db.category.create({
      data: { name: c.name, slug: uslug(c.name, c.id), icon: iconFor(c.name), sortOrder: i, isActive: true },
    });
    idMap.set(String(c.id), created.id);
  }
  // parent bağla
  for (const c of cats) {
    if (c.parentId && idMap.has(String(c.parentId))) {
      await db.category.update({
        where: { id: idMap.get(String(c.id)) },
        data: { parentId: idMap.get(String(c.parentId)) },
      });
    }
  }
  console.log(`✔ ${cats.length} kategori oluşturuldu.`);

  // 3) Ürünler — benzersiz slug/sku, createMany + görseller
  const usedPSlug = new Set();
  const usedSku = new Set();
  const rows = [];
  let skipped = 0;
  for (const p of products) {
    const categoryId = idMap.get(String(p.categoryId)) || null;
    const cost = p.priceNakit ?? p.priceCek;
    if (!p.name || !cost || cost <= 0) { skipped++; continue; }
    let slug = `${slugify(p.name)}-${p.id}`;
    if (usedPSlug.has(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    usedPSlug.add(slug);
    let sku = p.code || null;
    if (sku && usedSku.has(sku)) sku = `${sku}-${p.id}`;
    if (sku) usedSku.add(sku);
    const b2c = round2(cost * MARKUP);
    rows.push({
      slug,
      name: p.name.slice(0, 300),
      sku,
      barcode: null,
      categoryId,
      shortDescription: null,
      purchasePrice: new Prisma.Decimal(cost),
      listPrice: new Prisma.Decimal(p.priceCek ? round2(p.priceCek * MARKUP) : b2c),
      b2cPrice: new Prisma.Decimal(b2c),
      b2bPrice: new Prisma.Decimal(round2(cost * 1.1)),
      vatRate: 20,
      stock: p.stockQty ?? (p.inStock ? 100 : 0),
      unit: "adet",
      isActive: true,
      isFeatured: false,
      source: "MANUAL",
      _image: p.image || null,
    });
  }
  console.log(`Hazırlanan: ${rows.length} ürün (atlanan: ${skipped}).`);

  // createMany (görselsiz), chunk'lı
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK).map(({ _image, ...r }) => r);
    await db.product.createMany({ data: chunk, skipDuplicates: true });
    console.log(`  ürün ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }

  // görseller: slug→id eşle, ProductImage createMany
  const created = await db.product.findMany({ select: { id: true, slug: true } });
  const bySlug = new Map(created.map((p) => [p.slug, p.id]));
  const imgRows = [];
  for (const r of rows) {
    if (r._image && bySlug.has(r.slug)) {
      imgRows.push({ productId: bySlug.get(r.slug), url: r._image, isPrimary: true, sortOrder: 0 });
    }
  }
  for (let i = 0; i < imgRows.length; i += CHUNK) {
    await db.productImage.createMany({ data: imgRows.slice(i, i + CHUNK), skipDuplicates: true });
  }
  console.log(`✔ ${imgRows.length} ürün görseli.`);

  // Öne çıkan: stoklu + görselli 24 ürün (ana sayfa vitrini)
  const feat = await db.product.findMany({
    where: { stock: { gt: 0 }, images: { some: {} } },
    select: { id: true },
    take: 24,
    orderBy: { b2cPrice: "desc" },
  });
  await db.product.updateMany({ where: { id: { in: feat.map((f) => f.id) } }, data: { isFeatured: true } });
  console.log(`✔ ${feat.length} öne çıkan ürün.`);

  console.log(`\n✅ İçe aktarma bitti: ${rows.length} ürün, ${cats.length} kategori.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
