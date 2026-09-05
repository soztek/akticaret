"use client";

import { useActionState } from "react";
import { createProductAction, type ProductFormState } from "@/lib/actions/admin-products";
import { ImageUpload } from "@/components/admin/image-upload";
import { FormError, SubmitButton } from "@/components/form";

function Num({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        name={name}
        type="number"
        step="0.01"
        required={required}
        className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
      />
    </label>
  );
}

export function NewProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, action] = useActionState<ProductFormState, FormData>(createProductAction, undefined);

  return (
    <form action={action} className="mt-5 space-y-5">
      <FormError message={state?.error} />

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Ürün Görseli</p>
        <ImageUpload name="imageUrl" />
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Ürün Adı *</span>
        <input
          name="name"
          required
          className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Stok Kodu (SKU)</span>
          <input
            name="sku"
            className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Kategori</span>
          <select
            name="categoryId"
            defaultValue=""
            className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
          >
            <option value="">— Kategori seçin —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Kısa Açıklama</span>
        <textarea
          name="shortDescription"
          rows={2}
          className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
        />
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Num label="Alış (maliyet)" name="purchasePrice" />
        <Num label="Liste Fiyatı" name="listPrice" />
        <Num label="Satış (B2C) *" name="b2cPrice" required />
        <Num label="Bayi (B2B)" name="b2bPrice" />
      </div>

      <label className="flex max-w-xs flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Stok</span>
        <input
          name="stock"
          type="number"
          defaultValue={0}
          className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange"
        />
      </label>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked className="accent-orange" />
          Aktif (sitede görünür)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" className="accent-orange" />
          Öne çıkan
        </label>
      </div>

      <SubmitButton>Ürünü Oluştur</SubmitButton>
    </form>
  );
}
