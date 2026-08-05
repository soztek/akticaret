import type { Metadata } from "next";
import { CategoryTile } from "@/components/shop/category-tile";
import { getNavCategories } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tüm Kategoriler",
  description: "AK TİCARET Yapı Malzemeleri tüm ürün kategorileri.",
};

export default async function CategoriesPage() {
  const categories = await getNavCategories();
  return (
    <div className="container-ak py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">Tüm Kategoriler</h1>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {categories.map((c) => (
          <CategoryTile
            key={c.id}
            name={c.name}
            slug={c.slug}
            icon={c.icon}
            imageUrl={c.imageUrl}
          />
        ))}
      </div>
    </div>
  );
}
