// 2M Kale B2B — KATALOG KAZIYICI
// Çalıştırma:
//   node --env-file=.env.2mkale scripts/kale-scrape.mjs --inspect   (tek sayfa, yapı doğrulama)
//   node --env-file=.env.2mkale scripts/kale-scrape.mjs             (tam kazıma → data/kale/*.json)
//
// Rate-limit'e saygılı: her istek arası gecikme + yeniden deneme.
// Kimlik bilgileri env'den. Görseller URL olarak saklanır (indirilmez).

import { load } from "cheerio";
import { mkdirSync, writeFileSync } from "fs";
import { login, fetchFollow, BASE } from "./kale-lib.mjs";

const INSPECT = process.argv.includes("--inspect");
const OUT = "data/kale";
const DELAY_MS = 1500; // istekler arası
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Gecikmeli + rate-limit farkında GET
async function getHtml(path, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    const res = await fetchFollow(path);
    const html = await res.text();
    if (/İstek limitini aştınız/i.test(html)) {
      const wait = 15000 * i;
      console.log(`   ⏳ rate-limit (${path}) — ${wait / 1000}sn bekle…`);
      await sleep(wait);
      continue;
    }
    return html;
  }
  throw new Error("Rate-limit aşılamadı: " + path);
}

const catIdOf = (href) => (href?.match(/-c(\d+)(?:[/?#]|$)/) || [])[1] || null;
const prodIdOf = (href) => (href?.match(/-p(\d+)(?:[/?#]|$)/) || [])[1] || null;

// --- Kategori ağacı (mega-menü) ---
export function parseCategoryTree(html) {
  const $ = load(html);
  const cats = new Map(); // id -> {id,name,slug,parentId}
  // Üst kategori bağlantıları: turbo-main + href -cID
  $("a.turbo-main[href*='-c']").each((_, a) => {
    const $a = $(a);
    const href = $a.attr("href");
    const id = catIdOf(href);
    if (!id || cats.has(id)) return;
    const name = ($a.find("span").first().text() || $a.text()).trim();
    // parent: en yakın ata li > a (kategori)
    let parentId = null;
    const $parentLi = $a.closest("ul.sub-menu").parent("li");
    if ($parentLi.length) {
      const ph = $parentLi.children("a").first().attr("href");
      parentId = catIdOf(ph);
    }
    if (name) cats.set(id, { id, name, slug: href.replace(/^\//, ""), parentId });
  });
  return [...cats.values()];
}

// --- Ürün kartı ayrıştırma (gerçek yapı: div.card) ---
export function parseProducts(html, categoryId) {
  const $ = load(html);
  const out = [];
  const seen = new Set();
  const num = (s) => (s ? parseFloat(s.replace(/\./g, "").replace(",", ".")) : null);

  $("div.card").each((_, el) => {
    const $c = $(el);
    const a = $c.find("a[href*='-p']").filter((_, x) => /-p\d+$/.test($(x).attr("href") || "")).first();
    const href = a.attr("href");
    const id = prodIdOf(href);
    if (!id || seen.has(id)) return;
    if (!/Nakit|Havale/.test($c.text())) return;
    seen.add(id);

    // Ad: h6 başlığı ya da img alt
    let name = $c.find("h6").first().text().trim();
    if (!name) name = ($c.find("img").first().attr("alt") || "").trim();

    // Görsel
    let img = $c.find("img").first().attr("src") || $c.find("img").first().attr("data-src") || null;
    if (img && img.startsWith("/")) img = BASE + img;

    // Kod: stok satırındaki doğrudan .fw-semibold (Stok etiketi hariç)
    let code = null;
    $c.find("div.hstack.justify-content-between").each((_, r) => {
      const d = $(r).children("div.fw-semibold").last();
      const t = d.text().trim();
      if (t && !/^Stok$/i.test(t)) code = t;
    });
    if (!code) {
      $c.find("div.fw-semibold").each((_, d) => {
        const t = $(d).text().trim();
        if (!code && /^[A-Za-z0-9][A-Za-z0-9._\-/]{1,24}$/.test(t) && !/^Stok$/i.test(t) && !/TL/.test(t)) code = t;
      });
    }

    // Stok miktarı (tooltip) + durum
    const stockTitle = $c.find('[data-bs-title^="Stok Miktarı"]').attr("data-bs-title") || "";
    const stockQty = (stockTitle.match(/(\d+)/) || [])[1];
    const inStock = $c.find(".text-success").length > 0 || (stockQty && +stockQty > 0);

    const txt = $c.text().replace(/\s+/g, " ");
    const cek = num((txt.match(/Çek:\s*([\d.,]+)\s*TL/i) || [])[1]);
    const nakit = num((txt.match(/Nakit\s*\(?Havale\)?:\s*([\d.,]+)\s*TL/i) || [])[1]);

    out.push({
      id,
      url: BASE + (href.startsWith("/") ? href : "/" + href),
      name: name || null,
      code: code || null,
      priceCek: cek,
      priceNakit: nakit,
      image: img,
      categoryId,
      stockQty: stockQty ? +stockQty : null,
      inStock: !!inStock,
    });
  });
  return out;
}

async function main() {
  console.log("Giriş yapılıyor…");
  await login();
  console.log("✅ giriş OK");

  const homeHtml = await getHtml("/");
  const tree = parseCategoryTree(homeHtml);
  console.log(`Kategori ağacı: ${tree.length} kategori.`);
  console.log("İlk 8:", tree.slice(0, 8).map((c) => `${c.name}${c.parentId ? " ←" + c.parentId : ""}`));

  // Yaprak (leaf) kategoriler = başka kategorinin parent'ı olmayanlar
  const parentIds = new Set(tree.map((c) => c.parentId).filter(Boolean));
  const leaves = tree.filter((c) => !parentIds.has(c.id));
  console.log(`Yaprak kategori: ${leaves.length} (ürünler bunlardan çekilecek).`);

  if (INSPECT) {
    const cat = leaves[0] || tree[0];
    console.log(`\n[INSPECT] Örnek kategori: ${cat.name} (/${cat.slug})`);
    const html = await getHtml("/" + cat.slug);
    mkdirSync(OUT, { recursive: true });
    writeFileSync(OUT + "/_sample.html", html);
    const prods = parseProducts(html, cat.id);
    console.log(`Sayfada ${prods.length} ürün ayrıştırıldı. İlk 3:`);
    console.log(JSON.stringify(prods.slice(0, 3), null, 1));
    console.log("\nHam sayfa: data/kale/_sample.html (kart yapısı için)");
    return;
  }

  // TAM KAZIMA
  mkdirSync(OUT, { recursive: true });
  writeFileSync(OUT + "/categories.json", JSON.stringify(tree, null, 1));

  const products = new Map();
  let ci = 0;
  for (const cat of leaves) {
    ci++;
    let page = 1;
    let pageCount = 0;
    while (true) {
      const html = await getHtml(`/${cat.slug}?page=${page}`);
      const prods = parseProducts(html, cat.id);
      if (prods.length === 0) break;
      for (const p of prods) if (!products.has(p.id)) products.set(p.id, p);
      pageCount++;
      // sonraki sayfa var mı?
      const hasNext = new RegExp(`${cat.slug}\\?page=${page + 1}`).test(html);
      await sleep(DELAY_MS);
      if (!hasNext) break;
      page++;
      if (page > 200) break; // güvenlik
    }
    console.log(`[${ci}/${leaves.length}] ${cat.name}: ${pageCount} sayfa | toplam ürün: ${products.size}`);
    writeFileSync(OUT + "/products.json", JSON.stringify([...products.values()], null, 1));
  }
  console.log(`\n✅ Bitti. ${products.size} benzersiz ürün → ${OUT}/products.json`);
}

if ((process.argv[1] || "").replace(/\\/g, "/").endsWith("kale-scrape.mjs")) {
  main().catch((e) => {
    console.error("HATA:", e.message);
    process.exit(1);
  });
}
