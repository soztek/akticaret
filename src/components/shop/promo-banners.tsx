import Link from "next/link";
import { Percent, Tag, ArrowRight } from "lucide-react";
import { formatTL, discountPercent } from "@/lib/format";

export type PromoCampaignCard = {
  id: string;
  title: string;
  slug: string;
  badge: string | null;
  price: number | null;
  compareAtPrice: number | null;
  productSlug: string | null;
};

/** Ana sayfa kampanya banner şeridi — admin'de yayınlanan kampanyalardan beslenir. */
export function PromoBanners({ campaigns }: { campaigns: PromoCampaignCard[] }) {
  // Yayında kampanya yoksa: tek "Kampanyaları Keşfet" bandı
  if (campaigns.length === 0) {
    return (
      <Link
        href="/kampanyalar"
        className="group flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-navy to-navy-dark p-6 text-paper transition hover:shadow-lg"
      >
        <div>
          <p className="text-lg font-bold sm:text-xl">Güncel Kampanyalar</p>
          <p className="text-sm text-mist/70">Fırsat ürünlerini keşfedin.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-white">
          Kampanyaları Gör <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.slice(0, 6).map((c) => {
        const href = c.productSlug ? `/urun/${c.productSlug}` : `/kampanyalar/${c.slug}`;
        const disc =
          c.price != null && c.compareAtPrice != null
            ? discountPercent(c.compareAtPrice, c.price)
            : null;
        const big = c.badge || (disc != null ? `%${disc} İNDİRİM` : c.price != null ? formatTL(c.price) : null);

        return (
          <Link
            key={c.id}
            href={href}
            className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-navy p-5 text-paper transition hover:shadow-lg"
          >
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-light">
                Kampanya
              </span>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-mist">{c.title}</p>
              {big && <p className="mt-1 text-2xl font-extrabold text-orange">{big}</p>}
              <span className="mt-3 inline-block rounded-md bg-orange px-3 py-1.5 text-xs font-semibold text-white">
                Alışverişe Başla
              </span>
            </div>
            {c.badge ? (
              <Tag className="h-16 w-16 shrink-0 text-white/10 transition group-hover:text-white/20" />
            ) : (
              <Percent className="h-16 w-16 shrink-0 text-white/10 transition group-hover:text-white/20" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
