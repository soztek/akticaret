"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { addToCart } from "@/lib/cart-client";
import { resolvePrice, GUEST_VIEW, type PriceView } from "@/lib/pricing";
import type { ProductCardData } from "@/lib/catalog";

/** Ürün kartı içindeki hızlı "Sepete Ekle" — detaya girmeden ekler.
 *  variant="icon": küçük ikon buton (Hepsiburada stili). "full": tam genişlik. */
export function AddToCartButton({
  product,
  view = GUEST_VIEW,
  variant = "icon",
}: {
  product: ProductCardData;
  view?: PriceView;
  variant?: "icon" | "full";
}) {
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;
  const { price } = resolvePrice(product, view);

  function handle() {
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price,
        vatRate: product.vatRate,
        unit: product.unit,
        imageUrl: product.imageUrl,
      },
      1,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={outOfStock}
        aria-label={outOfStock ? "Stokta yok" : "Sepete ekle"}
        title={outOfStock ? "Stokta yok" : "Sepete ekle"}
        className={
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition " +
          (outOfStock
            ? "cursor-not-allowed bg-mist text-faint"
            : added
              ? "bg-success text-white"
              : "bg-orange text-white hover:bg-orange-600")
        }
      >
        {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={outOfStock}
      className={
        "flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition " +
        (outOfStock
          ? "cursor-not-allowed bg-mist text-faint"
          : added
            ? "bg-success text-white"
            : "bg-orange text-white hover:bg-orange-600")
      }
    >
      {outOfStock ? "Stokta Yok" : added ? (
        <><Check className="h-4 w-4" /> Eklendi</>
      ) : (
        <><ShoppingCart className="h-4 w-4" /> Sepete Ekle</>
      )}
    </button>
  );
}
