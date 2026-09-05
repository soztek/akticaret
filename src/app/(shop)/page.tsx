import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Hero } from "@/components/shop/hero";
import { PromoBanners } from "@/components/shop/promo-banners";
import { db } from "@/lib/db";
import { getFeaturedProducts, getDiscountedProducts, getBrands } from "@/lib/catalog";
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
  const now = new Date();
  const [featured, discounted, brands, heroBanner, view, campaigns] = await Promise.all([
    getFeaturedProducts(10),
    getDiscountedProducts(10),
    getBrands(),
    db.banner.findFirst({
      where: { position: "HERO", isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { imageUrl: true },
    }),
    getPriceView(),
    db.promoCampaign.findMany({
      where: {
        isPublished: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 6,
      include: { product: { select: { slug: true } } },
    }),
  ]);

  return (
    <>
      <Hero imageUrl={heroBanner?.imageUrl || null} />

      {/* KAMPANYALAR (admin'den yayınlananlar) */}
      <section className="container-ak py-8">
        <SectionTitle title="Kampanyalar" href="/kampanyalar" />
        <PromoBanners
          campaigns={campaigns.map((c) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            badge: c.badge,
            price: c.price != null ? Number(c.price) : null,
            compareAtPrice: c.compareAtPrice != null ? Number(c.compareAtPrice) : null,
            productSlug: c.product?.slug ?? null,
          }))}
        />
      </section>

      {/* ÖNE ÇIKANLAR */}
      {featured.length > 0 && (
        <section className="container-ak py-8 pt-0">
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
