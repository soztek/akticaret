import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { NewProductForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-3xl">
      <Link href="/admin/urunler" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-orange">
        <ArrowLeft className="h-4 w-4" /> Ürünlere dön
      </Link>
      <h1 className="text-2xl font-bold text-ink">Yeni Ürün</h1>
      <NewProductForm categories={categories} />
    </div>
  );
}
