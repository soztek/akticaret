import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { MessageCircle, ArrowRight, Tag } from "lucide-react";
import { db } from "@/lib/db";
import { formatTL, discountPercent, formatBadge } from "@/lib/format";
import { Breadcrumb } from "@/components/shop/breadcrumb";

export const dynamic = "force-dynamic";

const WA = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "905385832704";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.promoCampaign.findUnique({ where: { slug } });
  if (!c) return { title: "Kampanya bulunamadı" };
  return { title: c.title, description: c.description ?? `${c.title} — AK TİCARET kampanya.` };
}

export default async function CampaignDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await db.promoCampaign.findUnique({
    where: { slug },
    include: { product: { select: { slug: true, name: true } } },
  });
  if (!c || !c.isPublished) notFound();

  const price = c.price != null ? Number(c.price) : null;
  const compareAt = c.compareAtPrice != null ? Number(c.compareAtPrice) : null;
  const disc = price != null && compareAt != null ? discountPercent(compareAt, price) : null;

  const waMsg = encodeURIComponent(`Merhaba, AK TİCARET "${c.title}" kampanyası hakkında bilgi almak istiyorum.`);

  return (
    <div className="container-ak py-6">
      <Breadcrumb items={[{ label: "Kampanyalar", href: "/kampanyalar" }, { label: c.title }]} />

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-paper">
          {c.imageUrl ? (
            <Image src={c.imageUrl} alt={c.title} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-faint"><Tag className="h-16 w-16" /></div>
          )}
          {(c.badge || disc) && (
            <span className="absolute left-3 top-3 rounded-md bg-orange px-2.5 py-1 text-sm font-bold text-white">
              {formatBadge(c.badge) || `%${disc} İndirim`}
            </span>
          )}
        </div>

        <div>
          <span className="inline-block rounded-full bg-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange">
            Kampanya
          </span>
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{c.title}</h1>

          {price != null && (
            <div className="mt-4 flex items-end gap-3">
              {compareAt != null && compareAt > price && (
                <span className="text-lg text-faint line-through">{formatTL(compareAt)}</span>
              )}
              <span className="text-3xl font-extrabold text-navy">{formatTL(price)}</span>
            </div>
          )}

          {c.description && <p className="mt-5 whitespace-pre-line text-muted">{c.description}</p>}

          <div className="mt-7 flex flex-wrap gap-3">
            {c.product && (
              <Link
                href={`/urun/${c.product.slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 font-bold text-white hover:bg-orange-600"
              >
                Ürünü İncele <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <a
              href={`https://wa.me/${WA}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-success px-6 py-3 font-semibold text-success hover:bg-success/5"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp&apos;tan Sor
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
