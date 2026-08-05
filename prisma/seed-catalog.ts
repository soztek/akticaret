import { PrismaClient, Prisma } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const db = new PrismaClient();

// ============================================================
// GERÇEK KATEGORİ YAPISI (firmanın broşüründen) + demo ürünler.
// Kategoriler firmanın tanıtım materyalindeki 13 kategoriyle birebir,
// görseller broşürden kırpıldı (public/kategori/<slug>.jpg).
// Ürünler DEMO'dur (spec §55) — gerçek fiyat/stok Bizim Hesap'tan gelecek.
// Idempotent değil: katalog tabloları önce temizlenir (sadece katalog;
// kullanıcı/ayar/yetki KORUNUR).
// ============================================================

type Cat = { name: string; slug: string; icon: string };

const CATEGORIES: Cat[] = [
  { name: "Çimento", slug: "cimento", icon: "Package" },
  { name: "Demir", slug: "demir", icon: "Grip" },
  { name: "Tuğla", slug: "tugla", icon: "Blocks" },
  { name: "Kum & Çakıl", slug: "kum-cakil", icon: "Mountain" },
  { name: "Yalıtım", slug: "yalitim", icon: "Layers" },
  { name: "Boya", slug: "boya", icon: "PaintRoller" },
  { name: "Hırdavat", slug: "hirdavat", icon: "Wrench" },
  { name: "Su Tesisatı", slug: "su-tesisati", icon: "Droplets" },
  { name: "Elektrik", slug: "elektrik", icon: "Zap" },
  { name: "Seramik", slug: "seramik", icon: "Grid2x2" },
  { name: "Alçı & Kireç", slug: "alci-kirec", icon: "Layers" },
  { name: "Yapı Kimyasalları", slug: "yapi-kimyasallari", icon: "FlaskConical" },
  { name: "İnşaat Malzemeleri", slug: "insaat-malzemeleri", icon: "Building2" },
];

const BRANDS = [
  "Akçansa", "Nuh Çimento", "İçdaş", "Ytong", "İzocam",
  "Filli Boya", "Marshall", "Kalekim", "Knauf", "Ceresit", "Bosch",
];

type P = {
  name: string;
  cat: string; // kategori slug
  brand?: string;
  list: number;
  b2c: number;
  b2b?: number;
  stock: number;
  unit?: string;
  featured?: boolean;
  desc: string;
};

const PRODUCTS: P[] = [
  // Çimento
  { name: "Portland Çimento CEM I 42.5 R - 50 kg", cat: "cimento", brand: "Akçansa", list: 205, b2c: 179.9, b2b: 165, stock: 480, unit: "torba", featured: true, desc: "Yüksek erken dayanım, genel amaçlı yapı çimentosu." },
  { name: "Torbalı Çimento 32.5 R - 50 kg", cat: "cimento", brand: "Nuh Çimento", list: 185, b2c: 159.9, b2b: 148, stock: 520, unit: "torba", desc: "Sıva, şap ve genel imalat için." },
  { name: "Beyaz Çimento - 25 kg", cat: "cimento", brand: "Akçansa", list: 320, b2c: 289, stock: 160, unit: "torba", desc: "Dekoratif ve derz uygulamaları." },

  // Demir
  { name: "Nervürlü İnşaat Demiri Ø12 mm", cat: "demir", brand: "İçdaş", list: 42, b2c: 37.5, b2b: 34, stock: 8000, unit: "kg", featured: true, desc: "B420C betonarme çeliği, TSE belgeli." },
  { name: "Nervürlü İnşaat Demiri Ø8 mm", cat: "demir", brand: "İçdaş", list: 44, b2c: 39, stock: 6500, unit: "kg", desc: "Etriye ve donatı için." },
  { name: "Çelik Hasır Q188/188 - 5x2.15 m", cat: "demir", brand: "İçdaş", list: 1450, b2c: 1290, b2b: 1190, stock: 220, unit: "adet", desc: "Döşeme ve saha betonu donatısı." },

  // Tuğla
  { name: "Yatay Delikli Tuğla 19'luk", cat: "tugla", list: 9.5, b2c: 7.9, b2b: 7.2, stock: 42000, unit: "adet", featured: true, desc: "Duvar örgü tuğlası, hafif ve yalıtımlı." },
  { name: "Gazbeton Blok 60x25x20 cm", cat: "tugla", brand: "Ytong", list: 78, b2c: 69, stock: 3400, unit: "adet", desc: "Isı yalıtımlı hafif yapı bloğu." },
  { name: "Bims Briket 19x19x39 cm", cat: "tugla", list: 22, b2c: 18.5, stock: 9800, unit: "adet", desc: "Pomza esaslı hafif briket." },

  // Kum & Çakıl
  { name: "Yıkanmış İnce Kum - Big Bag (1 ton)", cat: "kum-cakil", list: 950, b2c: 849, b2b: 790, stock: 60, unit: "ton", featured: true, desc: "Sıva ve şap için elenmiş kum." },
  { name: "Mıcır No:1 (5-12 mm) - Torba", cat: "kum-cakil", list: 95, b2c: 84.9, stock: 300, unit: "torba", desc: "Beton ve drenaj agregası." },
  { name: "Dere Çakılı - Torba 25 kg", cat: "kum-cakil", list: 70, b2c: 59.9, stock: 260, unit: "torba", desc: "Peyzaj ve beton uygulamaları." },

  // Yalıtım
  { name: "XPS Isı Yalıtım Levhası 5 cm", cat: "yalitim", brand: "İzocam", list: 320, b2c: 279, b2b: 255, stock: 400, unit: "m²", featured: true, desc: "Yüksek basınç dayanımlı ısı yalıtımı." },
  { name: "Taş Yünü Levha 5 cm", cat: "yalitim", brand: "İzocam", list: 260, b2c: 229, stock: 350, unit: "m²", desc: "Isı ve ses yalıtımı, yanmaz." },
  { name: "Su Yalıtım Membranı 3 mm - Rulo", cat: "yalitim", list: 890, b2c: 790, stock: 120, unit: "rulo", desc: "Bitümlü örtü, temel ve teras için." },

  // Boya
  { name: "İç Cephe Silinebilir Boya 15 L (Beyaz)", cat: "boya", brand: "Filli Boya", list: 1890, b2c: 1650, b2b: 1490, stock: 90, unit: "kova", featured: true, desc: "Yüksek örtücülük, silinebilir mat." },
  { name: "Dış Cephe Boyası 15 L", cat: "boya", brand: "Marshall", list: 2490, b2c: 2190, stock: 60, unit: "kova", desc: "UV ve su dayanımlı, mantar önleyici." },
  { name: "Akrilik Astar 10 L", cat: "boya", brand: "Filli Boya", list: 990, b2c: 849, stock: 110, unit: "kova", desc: "Yüzey sağlamlaştırıcı, tutunma artırıcı." },
  { name: "Rulo & Fırça Seti 9 Parça", cat: "boya", brand: "Marshall", list: 320, b2c: 269, stock: 150, unit: "set", desc: "Tava, mini rulo ve fırça dahil." },

  // Hırdavat
  { name: "Darbeli Matkap 750 W", cat: "hirdavat", brand: "Bosch", list: 2890, b2c: 2490, b2b: 2290, stock: 45, unit: "adet", featured: true, desc: "13 mm mandren, değişken devir." },
  { name: "Sunta Vidası 4x50 (200 adet)", cat: "hirdavat", list: 95, b2c: 79.9, stock: 380, unit: "kutu", desc: "Çift dişli, hızlı vidalama." },
  { name: "Kombine Pense 180 mm", cat: "hirdavat", brand: "Bosch", list: 320, b2c: 289, stock: 120, unit: "adet", desc: "Krom-vanadyum çelik, izoleli sap." },
  { name: "Plastik Dübel 8 mm (100 adet)", cat: "hirdavat", list: 45, b2c: 34.9, stock: 640, unit: "paket", desc: "Genleşmeli, tüm duvar tipleri." },

  // Su Tesisatı
  { name: "PPRC Boru Ø25 mm (4 m)", cat: "su-tesisati", list: 130, b2c: 109, b2b: 99, stock: 500, unit: "adet", featured: true, desc: "Sıcak-soğuk su tesisatı." },
  { name: "PVC Pis Su Borusu Ø100 mm (3 m)", cat: "su-tesisati", list: 220, b2c: 189, stock: 300, unit: "adet", desc: "Atık su gider hattı." },
  { name: "Küresel Vana 1/2\"", cat: "su-tesisati", list: 180, b2c: 149, stock: 240, unit: "adet", desc: "Pirinç gövde, tam geçişli." },
  { name: "Mutfak Eviye Bataryası", cat: "su-tesisati", list: 1290, b2c: 1090, b2b: 990, stock: 65, unit: "adet", desc: "Krom kaplama, hareketli musluk." },

  // Elektrik
  { name: "NYA Kablo 2.5 mm² (100 m)", cat: "elektrik", list: 690, b2c: 599, b2b: 549, stock: 180, unit: "top", featured: true, desc: "Priz ve aydınlatma hattı için." },
  { name: "Anahtar-Priz Seti (Beyaz)", cat: "elektrik", list: 85, b2c: 69.9, stock: 400, unit: "adet", desc: "Çerçeve dahil, sıva altı." },
  { name: "Kablo Kanalı 25x16 mm (2 m)", cat: "elektrik", list: 55, b2c: 44.9, stock: 320, unit: "adet", desc: "Yapışkanlı, beyaz PVC." },
  { name: "Sıva Altı Buat Ø70 mm (10 adet)", cat: "elektrik", list: 60, b2c: 49.9, stock: 280, unit: "paket", desc: "Alevlenmez, kapaklı." },

  // Seramik
  { name: "Yer Karosu 60x60 cm (Gri)", cat: "seramik", brand: "Kalekim", list: 320, b2c: 279, b2b: 255, stock: 900, unit: "m²", featured: true, desc: "Rektifiyeli, kaymaz yüzey." },
  { name: "Duvar Fayansı 30x60 cm", cat: "seramik", brand: "Kalekim", list: 260, b2c: 229, stock: 700, unit: "m²", desc: "Parlak yüzey, banyo-mutfak." },
  { name: "Seramik Yapıştırıcı 25 kg", cat: "seramik", brand: "Kalekim", list: 240, b2c: 209, b2b: 189, stock: 320, unit: "torba", desc: "Yüksek performans, kayma önleyici." },
  { name: "Derz Dolgu 5 kg", cat: "seramik", brand: "Kalekim", list: 140, b2c: 119, stock: 260, unit: "kutu", desc: "Su itici, esnek derz malzemesi." },

  // Alçı & Kireç
  { name: "Saten Alçı 25 kg", cat: "alci-kirec", brand: "Knauf", list: 145, b2c: 124.5, b2b: 112, stock: 260, unit: "torba", featured: true, desc: "İnce yüzey kaplama alçısı." },
  { name: "Kartonpiyer Alçısı 20 kg", cat: "alci-kirec", brand: "Knauf", list: 130, b2c: 109, stock: 180, unit: "torba", desc: "Dekoratif kartonpiyer ve tamir." },
  { name: "Sönmüş Kireç 20 kg", cat: "alci-kirec", list: 95, b2c: 79.9, stock: 300, unit: "torba", desc: "Sıva ve badana için." },
  { name: "Alçıpan Levha 120x250 cm", cat: "alci-kirec", brand: "Knauf", list: 260, b2c: 229, stock: 200, unit: "adet", desc: "9.5 mm standart alçı levha." },

  // Yapı Kimyasalları
  { name: "Silikon Şeffaf 280 ml", cat: "yapi-kimyasallari", brand: "Ceresit", list: 120, b2c: 99.9, stock: 420, unit: "adet", featured: true, desc: "Nötr, küf önleyici." },
  { name: "Poliüretan Köpük 750 ml", cat: "yapi-kimyasallari", brand: "Ceresit", list: 190, b2c: 159, b2b: 145, stock: 300, unit: "adet", desc: "Tabancalı montaj köpüğü." },
  { name: "Su Yalıtım Harcı 2K 20 kg", cat: "yapi-kimyasallari", brand: "Kalekim", list: 1690, b2c: 1490, stock: 70, unit: "set", desc: "İki bileşenli, esnek su yalıtımı." },
  { name: "Kendinden Yayılan Şap 25 kg", cat: "yapi-kimyasallari", brand: "Kalekim", list: 320, b2c: 279, stock: 150, unit: "torba", desc: "Zemin tesviye harcı." },

  // İnşaat Malzemeleri (genel)
  { name: "Alçıpan Profili DU 50 (3 m)", cat: "insaat-malzemeleri", list: 95, b2c: 79.9, stock: 500, unit: "adet", desc: "Galvaniz duvar profili." },
  { name: "İnşaat Teli 1.5 mm (5 kg)", cat: "insaat-malzemeleri", list: 190, b2c: 159, stock: 260, unit: "rulo", desc: "Bağ teli, galvaniz." },
  { name: "Çivi 5 cm (5 kg)", cat: "insaat-malzemeleri", list: 160, b2c: 129, stock: 300, unit: "kutu", desc: "Genel amaçlı düz çivi." },
  { name: "Kalıp Kontraplak 12 mm - 125x250 cm", cat: "insaat-malzemeleri", list: 690, b2c: 599, b2b: 549, stock: 180, unit: "adet", featured: true, desc: "Filmli beton kalıp levhası." },
];

async function main() {
  console.log("🌱 Gerçek kategori yapısı + demo katalog seed...");

  // Katalog temizliği (kullanıcı/ayar/yetki KORUNUR)
  await db.productImage.deleteMany();
  await db.bizimHesapProductMapping.deleteMany();
  await db.bizimHesapCategoryMapping.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.brand.deleteMany();
  await db.banner.deleteMany({ where: { position: "HERO" } });
  console.log("✔ Eski katalog verisi temizlendi.");

  // Markalar
  const brandBySlug = new Map<string, string>();
  for (let i = 0; i < BRANDS.length; i++) {
    const name = BRANDS[i];
    const slug = slugify(name);
    const b = await db.brand.create({ data: { name, slug, sortOrder: i } });
    brandBySlug.set(name, b.id);
  }
  console.log(`✔ ${BRANDS.length} marka.`);

  // Kategoriler (13, düz — broşürdeki gerçek liste + görsel)
  const catBySlug = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const cat = await db.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        imageUrl: `/kategori/${c.slug}.jpg`,
        sortOrder: i,
      },
    });
    catBySlug.set(c.slug, cat.id);
  }
  console.log(`✔ ${CATEGORIES.length} kategori (görselleriyle).`);

  // Ürünler
  let pCount = 0;
  for (const p of PRODUCTS) {
    const categoryId = catBySlug.get(p.cat);
    if (!categoryId) {
      console.warn(`⚠ kategori yok: ${p.cat} (${p.name})`);
      continue;
    }
    await db.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        categoryId,
        brandId: p.brand ? brandBySlug.get(p.brand) ?? null : null,
        shortDescription: p.desc,
        listPrice: new Prisma.Decimal(p.list),
        b2cPrice: new Prisma.Decimal(p.b2c),
        b2bPrice: p.b2b != null ? new Prisma.Decimal(p.b2b) : null,
        vatRate: 20,
        stock: p.stock,
        unit: p.unit ?? "adet",
        isFeatured: p.featured ?? false,
        source: "MANUAL",
      },
    });
    pCount++;
  }
  console.log(`✔ ${pCount} ürün.`);

  // Hero banner (firmanın mağaza fotoğrafı)
  await db.banner.create({
    data: {
      id: "hero-1",
      title: "SAĞLAM YAPILAR, GÜVENLİ YARINLAR",
      subtitle: "Temelden çatıya, ihtiyacınız olan her şey burada.",
      imageUrl: "/hero-magaza.jpg",
      ctaLabel: "ÜRÜNLERİ KEŞFET",
      linkUrl: "/kategori/cimento",
      position: "HERO",
      isActive: true,
    },
  });
  console.log("✔ Hero banner (mağaza fotoğrafı).");

  console.log("✅ Katalog tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
