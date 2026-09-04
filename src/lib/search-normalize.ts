// Türkçe-duyarlı arama normalizasyonu: Türkçe harfleri ASCII'ye katlar + küçük harf.
// Ürünlerin `searchText` alanı bununla doldurulur; sorgu da bununla normalize edilir.
// SQL karşılığı: lower(translate(x, 'ÇĞİIÖŞÜçğıöşü', 'cgiiosucgiosu'))

const TR_FOLD: Record<string, string> = {
  Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
};

export function normalizeSearch(input: string): string {
  return input
    .split("")
    .map((ch) => TR_FOLD[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
