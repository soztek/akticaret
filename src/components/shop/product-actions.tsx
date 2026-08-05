"use client";

import { useState } from "react";
import { ShoppingCart, MessageCircle, FileText, Check, Minus, Plus } from "lucide-react";
import { addToCart } from "@/lib/cart-client";

const WA = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "905385832704";

export function ProductActions({
  product,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    unit: string;
    imageUrl: string | null;
    stock: number;
    minOrder: number;
  };
}) {
  const [qty, setQty] = useState(Math.max(1, product.minOrder));
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const waMsg = encodeURIComponent(
    `Merhaba, AK TİCARET web sitesindeki "${product.name}" ürünü hakkında bilgi almak istiyorum.`,
  );
  const teklifMsg = encodeURIComponent(
    `Merhaba, "${product.name}" ürünü için ${qty} ${product.unit} teklif almak istiyorum.`,
  );

  function handleAdd() {
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        unit: product.unit,
        imageUrl: product.imageUrl,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="space-y-3">
      {!outOfStock && (
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-line">
            <button
              onClick={() => setQty((q) => Math.max(product.minOrder, q - 1))}
              className="px-3 py-2.5 text-muted hover:text-ink"
              aria-label="Azalt"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              className="px-3 py-2.5 text-muted hover:text-ink"
              aria-label="Artır"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm text-success">
            {product.stock} {product.unit} stokta
          </span>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange px-6 py-3.5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-faint"
      >
        {added ? (
          <>
            <Check className="h-5 w-5" /> Sepete Eklendi
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" /> {outOfStock ? "Stokta Yok" : "Sepete Ekle"}
          </>
        )}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={`https://wa.me/${WA}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-success px-4 py-2.5 text-sm font-semibold text-success hover:bg-success/5"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp&apos;tan Sor
        </a>
        <a
          href={`https://wa.me/${WA}?text=${teklifMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-navy px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
        >
          <FileText className="h-4 w-4" /> Teklif İste
        </a>
      </div>
    </div>
  );
}
