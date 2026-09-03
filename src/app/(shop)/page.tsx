import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { CategoryTile } from "@/components/shop/category-tile";
import { Hero } from "@/components/shop/hero";
import { PromoBanners } from "@/components/shop/promo-banners";
import { db } from "@/lib/db";
import {
  getNavCategories,
  getFeaturedProducts,
  getDiscountedProducts,
  getBrands,
} from "@/lib/catalog";
import { getPriceView } from "@/lib/pricing-server";

export const dynamic = "force-dynamic";

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-orange hover:underline">
          Tümü <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [categories, featured, discounted, brands, heroBanner, view] = await Promise.all([
    getNavCategories(),
    getFeaturedProducts(10),
    getDiscountedProducts(10),
    getBrands(),
    db.banner.findFirst({
      where: { position: "HERO", isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { imageUrl: true },
    }),
    getPriceView(),
  ]);

  return (
    <>
      <Hero imageUrl={heroBanner?.imageUrl || null} />

      {/* KATEGORİLER (kompakt, tek satır — yana kayar) */}
      <section className="container-ak py-8">
        <SectionTitle title="Kategoriler" href="/kategoriler" />
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {categories.map((c) => (
            <CategoryTile
              key={c.id}
              name={c.name}
              slug={c.slug}
              icon={c.icon}
              imageUrl={c.imageUrl}
              compact
              className="w-28 shrink-0 sm:w-32"
            />
          ))}
        </div>
      </section>

      {/* KAMPANYA BANNER ŞERİDİ */}
      <PromoBanners />

      {/* ÖNE ÇIKANLAR */}
      {featured.length > 0 && (
        <section className="container-ak py-8">
          <SectionTitle title="Öne Çıkan Ürünler" href="/kategori/elektrikli-el-aletleri" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} view={view} />
            ))}
          </div>
        </section>
      )}

      {/* İNDİRİMLİLER */}
      {discounted.length > 0 && (
        <section className="border-y border-line bg-paper">
          <div className="container-ak py-8">
            <SectionTitle title="İndirimli Ürünler" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {discounted.map((p) => (
                <ProductCard key={p.id} product={p} view={view} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MARKALAR */}
      {brands.length > 0 && (
        <section className="border-t border-line bg-paper">
          <div className="container-ak py-8">
            <SectionTitle title="Markalar" />
            <div className="flex flex-wrap items-center justify-center gap-3">
              {brands.map((b) => (
                <span
                  key={b.id}
                  className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-navy"
                >
                  {b.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
