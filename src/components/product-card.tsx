import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { formatTL, discountPercent } from "@/lib/format";
import type { ProductCardData } from "@/lib/catalog";

export function ProductCard({ product }: { product: ProductCardData }) {
  const discount = discountPercent(product.listPrice, product.b2cPrice);
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/urun/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition hover:border-orange/50 hover:shadow-md"
    >
      <div className="relative aspect-square bg-mist">
        <ProductImage src={product.imageUrl} alt={product.name} />
        {discount && (
          <span className="absolute left-2 top-2 rounded-md bg-orange px-2 py-0.5 text-xs font-bold text-white">
            %{discount}
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-md bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white">
            Tükendi
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brandName && (
          <span className="text-xs font-semibold uppercase tracking-wide text-faint">
            {product.brandName}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-ink group-hover:text-navy">
          {product.name}
        </h3>
        <div className="mt-auto pt-2">
          {discount && (
            <span className="mr-2 text-xs text-faint line-through">
              {formatTL(product.listPrice)}
            </span>
          )}
          <span className="text-lg font-bold text-navy">{formatTL(product.b2cPrice)}</span>
          <span className="ml-1 text-xs text-muted">+KDV</span>
        </div>
      </div>
    </Link>
  );
}
