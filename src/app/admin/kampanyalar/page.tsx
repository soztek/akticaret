import Link from "next/link";
import Image from "next/image";
import { Plus, Tag, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { formatTL, formatBadge } from "@/lib/format";
import { CampaignRowActions } from "./campaign-row-actions";

export const dynamic = "force-dynamic";

export default async function AdminCampaigns() {
  const campaigns = await db.promoCampaign.findMany({
    orderBy: [{ isPublished: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: { product: { select: { slug: true, name: true } } },
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Kampanyalar <span className="text-lg font-medium text-muted">({campaigns.length})</span>
          </h1>
          <p className="text-sm text-muted">Ürün bağla veya yeni kampanya ürünü oluştur, yayınla.</p>
        </div>
        <Link
          href="/admin/kampanyalar/yeni"
          className="inline-flex items-center gap-1.5 rounded-full bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" /> Yeni Kampanya
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-paper p-12 text-center">
          <Tag className="h-10 w-10 text-orange" />
          <p className="text-muted">Henüz kampanya yok. &quot;Yeni Kampanya&quot; ile başlayın.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full text-sm">
            <thead className="bg-mist text-left text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Kampanya</th>
                <th className="px-4 py-2.5 font-semibold">Bağlı Ürün</th>
                <th className="px-4 py-2.5 font-semibold">Fiyat</th>
                <th className="px-4 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-mist/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-mist">
                        {c.imageUrl && <Image src={c.imageUrl} alt="" fill className="object-contain" sizes="40px" />}
                      </span>
                      <Link href={`/admin/kampanyalar/${c.id}`} className="inline-flex items-center gap-1 font-medium text-ink hover:text-orange">
                        {c.title} <Pencil className="h-3 w-3 opacity-50" />
                      </Link>
                      {c.badge && <span className="rounded bg-orange px-1.5 py-0.5 text-[10px] font-bold text-white">{formatBadge(c.badge)}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{c.product?.name ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-navy">
                    {c.price != null ? formatTL(Number(c.price)) : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <CampaignRowActions id={c.id} isPublished={c.isPublished} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
