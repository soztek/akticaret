"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ProductImage } from "@/components/product-image";

/** Ürün görsel galerisi: ana görsel + küçük resim şeridi (çoklu görsel). */
export function ProductGallery({
  images,
  name,
  discount,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
  discount: number | null;
}) {
  const [active, setActive] = useState(0);
  const current = images[active]?.url ?? null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-paper">
        <ProductImage src={current} alt={name} sizes="(max-width:1024px) 100vw, 50vw" />
        {discount && (
          <span className="absolute left-3 top-3 rounded-md bg-orange px-2.5 py-1 text-sm font-bold text-white">
            %{discount} İndirim
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={clsx(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-paper transition",
                i === active ? "border-orange ring-2 ring-orange/30" : "border-line hover:border-navy",
              )}
              aria-label={`Görsel ${i + 1}`}
            >
              <ProductImage src={img.url} alt={img.alt ?? name} sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
