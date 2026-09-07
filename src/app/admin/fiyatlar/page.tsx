import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { db } from "@/lib/db";
import { PriceManager } from "./price-manager";

export const dynamic = "force-dynamic";

export default async function PricesPage() {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) redirect("/admin");

  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, parentId: true },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Fiyat Yönetimi</h1>
        <p className="text-sm text-muted">
          Fiyatları kategori bazlı toplu (% zam/indirim, sabit tutar, maliyet+marj) veya ürün bazlı
          tek tek güncelleyin. Fiyatlar <b>KDV hariç</b> tutulur.
        </p>
      </div>
      <PriceManager categories={categories} />
    </div>
  );
}
