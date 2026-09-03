import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { ProductEditForm } from "./form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/urunler" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-orange">
        <ArrowLeft className="h-4 w-4" /> Ürünlere dön
      </Link>
      <h1 className="text-2xl font-bold text-ink">Ürün Düzenle</h1>

      <ProductEditForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          shortDescription: product.shortDescription,
          b2cPrice: Number(product.b2cPrice),
          listPrice: Number(product.listPrice),
          b2bPrice: product.b2bPrice != null ? Number(product.b2bPrice) : null,
          purchasePrice: product.purchasePrice != null ? Number(product.purchasePrice) : null,
          stock: product.stock,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          categoryId: product.categoryId,
          imageUrl: product.images[0]?.url ?? null,
        }}
        categories={categories}
      />
    </div>
  );
}
