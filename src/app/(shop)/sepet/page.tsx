"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Truck } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { formatTL, grossPrice } from "@/lib/format";
import { computeTotals, FREE_SHIPPING_THRESHOLD } from "@/lib/order-calc";
import {
  getCart,
  updateQty,
  removeFromCart,
  onCartChange,
  type CartLine,
} from "@/lib/cart-client";

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const refresh = () => setLines(getCart());
    refresh();
    return onCartChange(refresh);
  }, []);

  if (!mounted) {
    return <div className="container-ak py-16 text-center text-muted">Sepet yükleniyor…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="container-ak py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-line bg-paper p-10 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-faint" />
          <h1 className="mt-4 text-xl font-bold text-ink">Sepetiniz boş</h1>
          <p className="mt-2 text-muted">Ürünleri keşfedip sepete ekleyin.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Alışverişe Başla <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const totals = computeTotals(lines.map((l) => ({ price: l.price, qty: l.qty, vatRate: l.vatRate })));
  const remainingForFree = FREE_SHIPPING_THRESHOLD - totals.subtotal;

  return (
    <div className="container-ak py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">Sepetim ({lines.length} ürün)</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Ürünler */}
        <div className="divide-y divide-line rounded-xl border border-line bg-paper">
          {lines.map((l) => (
            <div key={l.productId} className="flex gap-4 p-4">
              <Link href={`/urun/${l.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-mist">
                <ProductImage src={l.imageUrl} alt={l.name} sizes="80px" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/urun/${l.slug}`} className="line-clamp-2 text-sm font-medium text-ink hover:text-orange">
                  {l.name}
                </Link>
                <p className="mt-0.5 text-sm text-muted">
                  {formatTL(grossPrice(l.price, l.vatRate))} <span className="text-xs">/ {l.unit}</span>
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-line">
                    <button onClick={() => updateQty(l.productId, l.qty - 1)} className="px-2.5 py-1.5 text-muted hover:text-ink" aria-label="Azalt">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{l.qty}</span>
                    <button onClick={() => updateQty(l.productId, l.qty + 1)} className="px-2.5 py-1.5 text-muted hover:text-ink" aria-label="Artır">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(l.productId)} className="flex items-center gap-1 text-xs text-muted hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" /> Kaldır
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-navy">{formatTL(grossPrice(l.price * l.qty, l.vatRate))}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Özet */}
        <aside className="h-max rounded-xl border border-line bg-paper p-5">
          <h2 className="text-lg font-bold text-ink">Sipariş Özeti</h2>

          {!totals.freeShipping && remainingForFree > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-orange/10 p-3 text-xs text-orange-600">
              <Truck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>{formatTL(remainingForFree)}</strong> daha ekleyin, <strong>kargo bedava</strong>!
              </span>
            </div>
          )}

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Ara Toplam</dt>
              <dd className="text-ink">{formatTL(totals.subtotalGross)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Kargo</dt>
              <dd className={totals.freeShipping ? "font-semibold text-success" : "text-ink"}>
                {totals.freeShipping ? "Bedava" : formatTL(totals.shipping)}
              </dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-3">
              <dt className="text-base font-bold text-ink">Genel Toplam</dt>
              <dd className="text-lg font-extrabold text-navy">{formatTL(totals.grandTotal)}</dd>
            </div>
          </dl>

          <Link
            href="/odeme"
            className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-orange px-6 py-3.5 font-bold text-white hover:bg-orange-600"
          >
            Ödemeye Geç <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/" className="mt-2 block text-center text-sm text-muted hover:text-orange">
            Alışverişe devam et
          </Link>
        </aside>
      </div>
    </div>
  );
}
