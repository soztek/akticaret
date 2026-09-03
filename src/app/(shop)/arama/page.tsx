import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { searchProducts } from "@/lib/catalog";
import { getPriceView } from "@/lib/pricing-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arama",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const [results, view] = await Promise.all([
    term.length >= 2 ? searchProducts(term, 48) : Promise.resolve([]),
    getPriceView(),
  ]);

  return (
    <div className="container-ak py-8">
      <h1 className="text-xl font-bold text-ink">
        {term ? <>&quot;{term}&quot; için arama sonuçları</> : "Arama"}
      </h1>
      <p className="mt-1 text-sm text-muted">{results.length} ürün bulundu</p>

      {term.length < 2 ? (
        <p className="mt-8 text-muted">En az 2 karakter girerek arama yapın.</p>
      ) : results.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-paper p-12 text-center text-muted">
          Sonuç bulunamadı. Farklı bir kelime deneyin.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}
