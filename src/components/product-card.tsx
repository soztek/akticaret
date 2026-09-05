import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { formatTL, discountPercent, grossPrice } from "@/lib/format";
import { resolvePrice, GUEST_VIEW, type PriceView } from "@/lib/pricing";
import type { ProductCardData } from "@/lib/catalog";

export function ProductCard({
  product,
  view = GUEST_VIEW,
}: {
  product: ProductCardData;
  view?: PriceView;
}) {
  const { price, compareAt, isDealer } = resolvePrice(product, view);
  const discount = compareAt ? discountPercent(compareAt, price) : null;
  const outOfStock = product.stock <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition hover:border-orange/50 hover:shadow-md">
      <Link href={`/urun/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square bg-mist">
          <ProductImage src={product.imageUrl} alt={product.name} />
          {discount && (
            <span className="absolute left-2 top-2 rounded-md bg-orange px-2 py-0.5 text-xs font-bold text-white">
              %{discount}
            </span>
          )}
          {isDealer && (
            <span className="absolute right-2 top-2 rounded-md bg-navy px-2 py-0.5 text-[10px] font-bold text-orange-light">
              BAYİ
            </span>
          )}
          {outOfStock && (
            <span className="absolute bottom-2 left-2 rounded-md bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white">
              Tükendi
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 px-3 pt-3">
          {product.brandName && (
            <span className="text-xs font-semibold uppercase tracking-wide text-faint">
              {product.brandName}
            </span>
          )}
          <h3 className="line-clamp-2 text-sm font-medium text-ink group-hover:text-navy">
            {product.name}
          </h3>
        </div>
      </Link>

      {/* Fiyat + hızlı sepet (Hepsiburada stili) */}
      <div className="flex items-end justify-between gap-2 p-3 pt-2">
        <div className="min-w-0">
          {compareAt && (
            <span className="block text-xs text-faint line-through">
              {formatTL(grossPrice(compareAt, product.vatRate))}
            </span>
          )}
          <span className="text-lg font-bold leading-tight text-navy">
            {formatTL(grossPrice(price, product.vatRate))}
          </span>
        </div>
        <AddToCartButton product={product} view={view} variant="icon" />
      </div>
    </div>
  );
}
