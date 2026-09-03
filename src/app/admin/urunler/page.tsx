import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatTL } from "@/lib/format";
import { Search, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; stok?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }
  if (sp.stok === "yok") where.stock = { lte: 0 };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        sku: true,
        b2cPrice: true,
        b2bPrice: true,
        stock: true,
        isActive: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sp.stok) params.set("stok", sp.stok);
    params.set("page", String(p));
    return `/admin/urunler?${params.toString()}`;
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Ürünler</h1>
          <p className="text-sm text-muted">{total.toLocaleString("tr-TR")} ürün</p>
        </div>
        <form className="relative" action="/admin/urunler">
          <input
            name="q"
            defaultValue={q}
            placeholder="Ürün adı veya kod ara…"
            className="w-64 rounded-lg border border-line bg-paper py-2 pl-3 pr-10 text-sm outline-none focus:border-orange"
          />
          <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-orange p-1.5 text-white">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-mist text-left text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Ürün</th>
              <th className="px-4 py-2.5 font-semibold">Kod</th>
              <th className="px-4 py-2.5 font-semibold">Kategori</th>
              <th className="px-4 py-2.5 font-semibold">Satış</th>
              <th className="px-4 py-2.5 font-semibold">Bayi</th>
              <th className="px-4 py-2.5 font-semibold">Stok</th>
              <th className="px-4 py-2.5 font-semibold">Durum</th>
              <th className="px-4 py-2.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-mist/50">
                <td className="max-w-xs px-4 py-2.5">
                  <span className="line-clamp-1 font-medium text-ink">{p.name}</span>
                </td>
                <td className="px-4 py-2.5 text-muted">{p.sku ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted">{p.category?.name ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-navy">{formatTL(Number(p.b2cPrice))}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                  {p.b2bPrice != null ? formatTL(Number(p.b2bPrice)) : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span className={p.stock > 0 ? "text-success" : "text-danger"}>{p.stock}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-medium " +
                      (p.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger")
                    }
                  >
                    {p.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/admin/urunler/${p.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink hover:border-orange hover:text-orange"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Düzenle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="rounded-md border border-line bg-paper px-3 py-1.5 hover:border-navy">
              ← Önceki
            </Link>
          )}
          <span className="px-2 text-muted">
            Sayfa {page} / {pages}
          </span>
          {page < pages && (
            <Link href={pageHref(page + 1)} className="rounded-md border border-line bg-paper px-3 py-1.5 hover:border-navy">
              Sonraki →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
