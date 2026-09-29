"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Percent, Tag, ArrowRight } from "lucide-react";
import { formatTL, discountPercent, formatBadge } from "@/lib/format";

export type PromoCampaignCard = {
  id: string;
  title: string;
  slug: string;
  badge: string | null;
  price: number | null;
  compareAtPrice: number | null;
  productSlug: string | null;
  imageUrl: string | null;
};

const VISIBLE = 3; // her zaman 3 kampanya
const INTERVAL = 5000; // 5 sn'de bir sırayla döner

/** Ana sayfa kampanya şeridi — her zaman 3 kampanya; 3'ten fazlaysa sırayla döner. */
export function PromoBanners({ campaigns }: { campaigns: PromoCampaignCard[] }) {
  const total = campaigns.length;
  const [start, setStart] = useState(0);

  useEffect(() => {
    if (total <= VISIBLE) return; // dönmeye gerek yok
    const t = setInterval(() => setStart((s) => (s + VISIBLE) % total), INTERVAL);
    return () => clearInterval(t);
  }, [total]);

  if (total === 0) {
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

  // Görünen 3'lü pencere (baştan sarmalı)
  const count = Math.min(VISIBLE, total);
  const visible = Array.from({ length: count }, (_, i) => campaigns[(start + i) % total]);

  return (
    <div key={start} className="grid animate-[fadeIn_0.5s_ease] gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((c) => {
        const href = c.productSlug ? `/urun/${c.productSlug}` : `/kampanyalar/${c.slug}`;
        const disc =
          c.price != null && c.compareAtPrice != null
            ? discountPercent(c.compareAtPrice, c.price)
            : null;
        const badge = formatBadge(c.badge);
        const big = badge || (disc != null ? `%${disc} İNDİRİM` : c.price != null ? formatTL(c.price) : null);

        return (
          <Link
            key={c.id}
            href={href}
            className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-xl bg-navy p-5 text-paper transition hover:shadow-lg"
          >
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-light">
                Kampanya
              </span>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-mist">{c.title}</p>
              {big && <p className="mt-1 text-2xl font-extrabold text-orange">{big}</p>}
              <span className="mt-3 inline-block rounded-md bg-orange px-3 py-1.5 text-xs font-semibold text-white">
                Alışverişe Başla
              </span>
            </div>
            {c.imageUrl ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-white/95 sm:h-28 sm:w-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageUrl}
                  alt={c.title}
                  className="h-full w-full object-contain p-1.5 transition group-hover:scale-105"
                />
              </div>
            ) : c.badge ? (
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
