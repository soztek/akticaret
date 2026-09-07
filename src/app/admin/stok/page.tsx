import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) redirect("/admin");

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Stok / Excel İçe Aktarma</h1>
        <p className="text-sm text-muted">
          Excel veya CSV dosyasından toplu ürün ve stok aktarımı. Ürünler <b>SKU (stok kodu)</b> ile
          eşleştirilir: eşleşen ürünler güncellenir, eşleşmeyenler yeni ürün olarak oluşturulur.
        </p>
      </div>

      <ImportForm />

      <div className="mt-6 rounded-xl border border-line bg-paper p-5 text-sm text-muted">
        <p className="mb-2 font-semibold text-ink">Sütun başlıkları (esnek)</p>
        <ul className="list-inside list-disc space-y-1">
          <li><b>SKU / Stok Kodu</b> — zorunlu, eşleştirme anahtarı</li>
          <li><b>Ürün Adı</b> — yeni ürün oluştururken zorunlu</li>
          <li>Barkod, Kategori, Marka, Birim, Kısa Açıklama, Aktif</li>
          <li>Liste Fiyatı, Satış Fiyatı (B2C), Bayi Fiyatı (B2B), Alış Fiyatı, KDV, Stok</li>
        </ul>
        <p className="mt-3">
          Fiyat biçimi <code>1.234,56</code> veya <code>1234.56</code> olabilir. Kategori adları mevcut
          kategorilerle eşleştirilir (bulunamazsa boş bırakılır); markalar bulunamazsa otomatik oluşturulur.
        </p>
      </div>
    </div>
  );
}
