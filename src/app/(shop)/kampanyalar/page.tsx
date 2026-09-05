import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { db } from "@/lib/db";
import { formatTL, discountPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kampanyalar",
  description: "AK TİCARET güncel kampanya ve fırsat ürünleri.",
};

async function getPublished() {
  const now = new Date();
  return db.promoCampaign.findMany({
    where: {
      isPublished: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { product: { select: { slug: true } } },
  });
}

export default async function CampaignsPage() {
  const campaigns = await getPublished();

  return (
    <div className="container-ak py-8">
      <div className="mb-6 flex items-center gap-2">
        <Tag className="h-6 w-6 text-orange" />
        <h1 className="text-2xl font-bold text-ink">Kampanyalar</h1>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper p-16 text-center text-muted">
          Şu anda yayında kampanya yok. Yakında görüşmek üzere!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {campaigns.map((c) => {
            const href = c.product ? `/urun/${c.product.slug}` : `/kampanyalar/${c.slug}`;
            const price = c.price != null ? Number(c.price) : null;
            const compareAt = c.compareAtPrice != null ? Number(c.compareAtPrice) : null;
            const disc = price != null && compareAt != null ? discountPercent(compareAt, price) : null;
            return (
              <Link
                key={c.id}
                href={href}
                className="group flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition hover:border-orange/50 hover:shadow-md"
              >
                <div className="relative aspect-square bg-mist">
                  {c.imageUrl ? (
                    <Image src={c.imageUrl} alt={c.title} fill sizes="(max-width:768px) 50vw, 25vw" className="object-contain transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-faint"><Tag className="h-10 w-10" /></div>
                  )}
                  {(c.badge || disc) && (
                    <span className="absolute left-2 top-2 rounded-md bg-orange px-2 py-0.5 text-xs font-bold text-white">
                      {c.badge || `%${disc}`}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <h3 className="line-clamp-2 text-sm font-medium text-ink group-hover:text-navy">{c.title}</h3>
                  {price != null && (
                    <div className="mt-auto pt-2">
                      {compareAt != null && compareAt > price && (
                        <span className="mr-2 text-xs text-faint line-through">{formatTL(compareAt)}</span>
                      )}
                      <span className="text-lg font-bold text-navy">{formatTL(price)}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
