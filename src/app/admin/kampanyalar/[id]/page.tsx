import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { CampaignForm } from "../campaign-form";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await db.promoCampaign.findUnique({
    where: { id },
    include: { product: { select: { name: true, slug: true } } },
  });
  if (!c) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/kampanyalar" className="inline-flex items-center gap-1 text-sm text-muted hover:text-orange">
          <ArrowLeft className="h-4 w-4" /> Kampanyalara dön
        </Link>
        <Link href={`/kampanyalar/${c.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-muted hover:text-orange">
          Sitede Gör <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-ink">Kampanya Düzenle</h1>
      <CampaignForm
        campaign={{
          id: c.id,
          title: c.title,
          imageUrl: c.imageUrl,
          description: c.description,
          price: c.price != null ? Number(c.price) : null,
          compareAtPrice: c.compareAtPrice != null ? Number(c.compareAtPrice) : null,
          badge: c.badge,
          productId: c.productId,
          isPublished: c.isPublished,
          startsAt: c.startsAt ? c.startsAt.toISOString().slice(0, 10) : null,
          endsAt: c.endsAt ? c.endsAt.toISOString().slice(0, 10) : null,
          linkedProduct: c.product ? { name: c.product.name, slug: c.product.slug } : null,
        }}
      />
    </div>
  );
}
