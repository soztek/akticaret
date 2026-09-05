"use client";

import { useActionState } from "react";
import { updateProductAction, type ProductFormState } from "@/lib/actions/admin-products";
import { ImageUpload } from "@/components/admin/image-upload";
import { FormError } from "@/components/form";

type P = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  shortDescription: string | null;
  b2cPrice: number;
  listPrice: number;
  b2bPrice: number | null;
  purchasePrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  imageUrl: string | null;
};

function Num({ label, name, defaultValue }: { label: string; name: string; defaultValue: number | null }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        name={name}
        type="number"
        step="0.01"
        defaultValue={defaultValue ?? ""}
        className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
      />
    </label>
  );
}

export function ProductEditForm({
  product,
  categories,
}: {
  product: P;
  categories: { id: string; name: string }[];
}) {
  const [state, action] = useActionState<ProductFormState, FormData>(updateProductAction, undefined);

  return (
    <form action={action} className="mt-5 space-y-5">
      <input type="hidden" name="id" value={product.id} />

      {state?.ok && (
        <div className="rounded-lg bg-success/10 px-4 py-2.5 text-sm font-medium text-success">
          Kaydedildi ✓
        </div>
      )}
      <FormError message={state?.error} />

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Ürün Görseli</p>
        <ImageUpload name="imageUrl" defaultUrl={product.imageUrl} />
      </div>

      <div className="space-y-1.5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Ürün Adı</span>
          <input
            name="name"
            defaultValue={product.name}
            required
            className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
          />
        </label>
        <p className="text-xs text-muted">Kod: {product.sku ?? "—"} · Slug: {product.slug}</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Kısa Açıklama</span>
        <textarea
          name="shortDescription"
          rows={2}
          defaultValue={product.shortDescription ?? ""}
          className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
        />
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Num label="Alış (maliyet)" name="purchasePrice" defaultValue={product.purchasePrice} />
        <Num label="Liste Fiyatı" name="listPrice" defaultValue={product.listPrice} />
        <Num label="Satış (B2C)" name="b2cPrice" defaultValue={product.b2cPrice} />
        <Num label="Bayi (B2B)" name="b2bPrice" defaultValue={product.b2bPrice} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Stok</span>
          <input
            name="stock"
            type="number"
            defaultValue={product.stock}
            className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Kategori</span>
          <select
            name="categoryId"
            defaultValue={product.categoryId ?? ""}
            className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
          >
            <option value="">— Kategori yok —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={product.isActive} className="accent-orange" />
          Aktif (sitede görünür)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} className="accent-orange" />
          Öne çıkan
        </label>
      </div>

      <div className="flex gap-3">
        <button className="rounded-lg bg-orange px-6 py-2.5 font-semibold text-white hover:bg-orange-600">
          Kaydet
        </button>
        <a
          href={`/urun/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-line px-6 py-2.5 font-semibold text-ink hover:border-navy"
        >
          Sitede Gör
        </a>
      </div>
    </form>
  );
}
