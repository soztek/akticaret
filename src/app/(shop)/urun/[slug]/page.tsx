import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductActions } from "@/components/shop/product-actions";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getPriceView } from "@/lib/pricing-server";
import { resolvePrice } from "@/lib/pricing";
import { formatTL, discountPercent } from "@/lib/format";
import { Star, ShieldCheck, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Ürün bulunamadı" };
  return {
    title: p.name,
    description: p.shortDescription ?? `${p.name} — AK TİCARET Yapı Malzemeleri.`,
    alternates: { canonical: `/urun/${p.slug}` },
    openGraph: { title: p.name, images: p.images[0]?.url ? [p.images[0].url] : [] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const [related, view] = await Promise.all([
    getRelatedProducts(p.categoryId, p.id, 5),
    getPriceView(),
  ]);
  const priced = resolvePrice(p, view);
  const discount = priced.compareAt ? discountPercent(priced.compareAt, priced.price) : null;
  const specs = (p.technicalSpecs && typeof p.technicalSpecs === "object"
    ? Object.entries(p.technicalSpecs as Record<string, unknown>)
    : []) as [string, unknown][];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku ?? undefined,
    gtin: p.barcode ?? undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand.name } : undefined,
    description: p.shortDescription ?? p.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: p.b2cPrice,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(p.ratingCount > 0 && p.ratingAvg
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.ratingAvg.toFixed(1),
            reviewCount: p.ratingCount,
          },
        }
      : {}),
  };

  const breadcrumb = [
    ...(p.category?.parent
      ? [{ label: p.category.parent.name, href: `/kategori/${p.category.parent.slug}` }]
      : []),
    ...(p.category ? [{ label: p.category.name, href: `/kategori/${p.category.slug}` }] : []),
    { label: p.name },
  ];

  return (
    <div className="container-ak py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb items={breadcrumb} />

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        {/* Görsel galerisi */}
        <ProductGallery images={p.images} name={p.name} discount={discount} />

        {/* Bilgi */}
        <div>
          {p.brand && (
            <span className="text-sm font-semibold uppercase tracking-wide text-faint">
              {p.brand.name}
            </span>
          )}
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{p.name}</h1>

          <div className="mt-2 flex items-center gap-4 text-sm text-muted">
            {p.sku && <span>Kod: {p.sku}</span>}
            {p.ratingCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <Star className="h-4 w-4 fill-current" /> {p.ratingAvg?.toFixed(1)} ({p.ratingCount})
              </span>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-line bg-paper p-5">
            {priced.isDealer && (
              <span className="mb-1 inline-block rounded-md bg-navy px-2 py-0.5 text-xs font-bold text-orange-light">
                BAYİ FİYATI
              </span>
            )}
            <div className="flex items-end gap-3">
              {priced.compareAt && (
                <span className="text-lg text-faint line-through">{formatTL(priced.compareAt)}</span>
              )}
              <span className="text-3xl font-extrabold text-navy">{formatTL(priced.price)}</span>
              <span className="pb-1 text-sm text-muted">+KDV</span>
            </div>
            {!priced.isDealer && p.b2bPrice != null && (
              <p className="mt-1 text-sm text-muted">
                Bayilere özel fiyatlar için{" "}
                <a href="/bayi/basvuru" className="font-medium text-orange underline">
                  bayi olun
                </a>
                .
              </p>
            )}

            <div className="mt-5">
              <ProductActions
                product={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  price: priced.price,
                  vatRate: p.vatRate,
                  unit: p.unit,
                  imageUrl: p.images[0]?.url ?? null,
                  stock: p.stock,
                  minOrder: p.minOrder,
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-orange" /> Hızlı teslimat</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-orange" /> Güvenli ödeme</span>
            {p.warranty && <span>Garanti: {p.warranty}</span>}
          </div>

          {p.shortDescription && <p className="mt-5 text-muted">{p.shortDescription}</p>}
        </div>
      </div>

      {/* Açıklama + teknik özellik */}
      {(p.description || specs.length > 0) && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {p.description && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-ink">Ürün Açıklaması</h2>
              <p className="whitespace-pre-line text-muted">{p.description}</p>
            </section>
          )}
          {specs.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-ink">Teknik Özellikler</h2>
              <table className="w-full overflow-hidden rounded-lg border border-line text-sm">
                <tbody>
                  {specs.map(([k, v], i) => (
                    <tr key={k} className={i % 2 ? "bg-mist" : "bg-paper"}>
                      <td className="px-3 py-2 font-medium text-ink">{k}</td>
                      <td className="px-3 py-2 text-muted">{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}

      {/* Benzer ürünler */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold text-ink">Benzer Ürünler</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((rp) => (
              <ProductCard key={rp.id} product={rp} view={view} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
