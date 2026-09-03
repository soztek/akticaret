import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { CategoryIcon } from "@/components/shop/category-icon";
import {
  getCategoryBySlug,
  getCategoryProducts,
  getCategoryBrands,
  getDescendantIds,
  type SortKey,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "new", label: "En Yeni" },
  { key: "price-asc", label: "Fiyat (Artan)" },
  { key: "price-desc", label: "Fiyat (Azalan)" },
  { key: "popular", label: "Çok Görüntülenen" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Kategori bulunamadı" };
  return {
    title: cat.seoTitle ?? cat.name,
    description: cat.seoDescription ?? `${cat.name} ürünleri — AK TİCARET Yapı Malzemeleri.`,
    alternates: { canonical: `/kategori/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const childIds = await getDescendantIds(cat.id);
  const allIds = [cat.id, ...childIds];

  const asStr = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const brandSlugs = (Array.isArray(sp.marka) ? sp.marka : sp.marka ? [sp.marka] : []) as string[];
  const minPrice = asStr(sp.min) ? Number(asStr(sp.min)) : undefined;
  const maxPrice = asStr(sp.max) ? Number(asStr(sp.max)) : undefined;
  const inStock = asStr(sp.stok) === "1";
  const sort = (asStr(sp.sirala) as SortKey) ?? "new";

  const [products, brands] = await Promise.all([
    getCategoryProducts({ categoryId: cat.id, childIds, brandSlugs, minPrice, maxPrice, inStock, sort }),
    getCategoryBrands(allIds),
  ]);

  const breadcrumb = [
    ...(cat.parent ? [{ label: cat.parent.name, href: `/kategori/${cat.parent.slug}` }] : []),
    { label: cat.name },
  ];

  return (
    <div className="container-ak py-6">
      <Breadcrumb items={breadcrumb} />

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy/5 text-navy">
          <CategoryIcon name={cat.icon} className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">{cat.name}</h1>
          <p className="text-sm text-muted">{products.length} ürün</p>
        </div>
      </div>

      {/* Alt kategoriler */}
      {cat.children.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {cat.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/kategori/${sub.slug}`}
              className="rounded-full border border-line bg-paper px-4 py-1.5 text-sm text-ink transition hover:border-orange hover:text-orange"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* FİLTRE */}
        <aside>
          <form method="get" className="rounded-xl border border-line bg-paper p-4 text-sm">
            <input type="hidden" name="sirala" value={sort} />
            <p className="mb-3 font-bold text-ink">Filtrele</p>

            {brands.length > 0 && (
              <fieldset className="mb-4">
                <legend className="mb-2 font-semibold text-muted">Marka</legend>
                <div className="space-y-1.5">
                  {brands.map((b) => (
                    <label key={b.slug} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="marka"
                        value={b.slug}
                        defaultChecked={brandSlugs.includes(b.slug)}
                        className="accent-orange"
                      />
                      {b.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="mb-4">
              <legend className="mb-2 font-semibold text-muted">Fiyat (₺)</legend>
              <div className="flex items-center gap-2">
                <input name="min" type="number" min="0" placeholder="Min" defaultValue={minPrice}
                  className="w-full rounded-md border border-line px-2 py-1.5" />
                <span>–</span>
                <input name="max" type="number" min="0" placeholder="Max" defaultValue={maxPrice}
                  className="w-full rounded-md border border-line px-2 py-1.5" />
              </div>
            </fieldset>

            <label className="mb-4 flex items-center gap-2">
              <input type="checkbox" name="stok" value="1" defaultChecked={inStock} className="accent-orange" />
              Sadece stokta olanlar
            </label>

            <div className="flex gap-2">
              <button className="flex-1 rounded-lg bg-orange px-3 py-2 font-semibold text-white hover:bg-orange-600">
                Uygula
              </button>
              <Link href={`/kategori/${cat.slug}`} className="rounded-lg border border-line px-3 py-2 text-center">
                Sıfırla
              </Link>
            </div>
          </form>
        </aside>

        {/* ÜRÜNLER */}
        <div>
          {/* Sıralama */}
          <div className="mb-4 flex flex-wrap gap-2">
            {SORTS.map((s) => {
              const q = new URLSearchParams();
              brandSlugs.forEach((b) => q.append("marka", b));
              if (minPrice != null) q.set("min", String(minPrice));
              if (maxPrice != null) q.set("max", String(maxPrice));
              if (inStock) q.set("stok", "1");
              q.set("sirala", s.key);
              const active = sort === s.key;
              return (
                <Link
                  key={s.key}
                  href={`/kategori/${cat.slug}?${q.toString()}`}
                  className={
                    "rounded-full px-3 py-1.5 text-sm " +
                    (active ? "bg-navy text-paper" : "border border-line bg-paper text-ink hover:border-navy")
                  }
                >
                  {s.label}
                </Link>
              );
            })}
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-paper p-12 text-center text-muted">
              Bu filtrelere uygun ürün bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
