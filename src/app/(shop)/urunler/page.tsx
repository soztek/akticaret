import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { getAllProducts, type SortKey } from "@/lib/catalog";
import { getPriceView } from "@/lib/pricing-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description: "AK GRUP YAPI — tüm yapı malzemeleri ve hırdavat ürünleri tek sayfada.",
  alternates: { canonical: "/urunler" },
};

const SORTS: { key: SortKey; label: string }[] = [
  { key: "new", label: "En Yeni" },
  { key: "price-asc", label: "Fiyat (Artan)" },
  { key: "price-desc", label: "Fiyat (Azalan)" },
  { key: "popular", label: "Çok Görüntülenen" },
];

function pageHref(page: number, sort: SortKey) {
  const p = new URLSearchParams();
  if (sort !== "new") p.set("sirala", sort);
  if (page > 1) p.set("sayfa", String(page));
  const qs = p.toString();
  return qs ? `/urunler?${qs}` : "/urunler";
}

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const asStr = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const sort = (asStr(sp.sirala) as SortKey) ?? "new";
  const page = Math.max(1, Number(asStr(sp.sayfa) ?? "1") || 1);

  const [{ products, total, totalPages, page: current }, view] = await Promise.all([
    getAllProducts({ page, sort }),
    getPriceView(),
  ]);

  return (
    <div className="container-ak py-6">
      <Breadcrumb items={[{ label: "Tüm Ürünler" }]} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tüm Ürünler</h1>
          <p className="text-sm text-muted">{total.toLocaleString("tr-TR")} ürün</p>
        </div>
        {/* Sıralama */}
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={pageHref(1, s.key)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                sort === s.key
                  ? "border-orange bg-orange/10 text-orange"
                  : "border-line text-navy hover:border-orange"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-line bg-paper p-12 text-center text-muted">
          Ürün bulunamadı.
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} view={view} />
            ))}
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Sayfalama">
              {current > 1 && (
                <Link href={pageHref(current - 1, sort)} className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-navy hover:border-orange">
                  ‹ Önceki
                </Link>
              )}
              {pageNumbers(current, totalPages).map((n, i) =>
                n === "…" ? (
                  <span key={`g${i}`} className="px-2 text-muted">…</span>
                ) : (
                  <Link
                    key={n}
                    href={pageHref(n as number, sort)}
                    className={`min-w-10 rounded-lg border px-3 py-2 text-center text-sm font-medium transition ${
                      n === current ? "border-orange bg-orange text-white" : "border-line text-navy hover:border-orange"
                    }`}
                  >
                    {n}
                  </Link>
                ),
              )}
              {current < totalPages && (
                <Link href={pageHref(current + 1, sort)} className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-navy hover:border-orange">
                  Sonraki ›
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

/** Sayfa numaraları: 1 … c-1 c c+1 … son */
function pageNumbers(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (n: number) => out.push(n);
  const window = 1;
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || (n >= current - window && n <= current + window)) {
      add(n);
    } else if (out[out.length - 1] !== "…") {
      out.push("…");
    }
  }
  return out;
}
