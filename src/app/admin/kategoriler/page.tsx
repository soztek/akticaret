import { db } from "@/lib/db";
import { CategoryManager, type AdminCat } from "./category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const cats = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      parentId: true,
      icon: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });

  const categories: AdminCat[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
    icon: c.icon,
    isActive: c.isActive,
    productCount: c._count.products,
  }));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">
          Kategoriler <span className="text-lg font-medium text-muted">({categories.length})</span>
        </h1>
        <p className="text-sm text-muted">Ekle, düzenle, kopyala, sil · alt kategorileri daralt/genişlet</p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
