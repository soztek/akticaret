"use client";

import { useState, useTransition, useMemo } from "react";
import { Layers, Package, Eye, CheckCircle2, Loader2, Search, Save } from "lucide-react";
import {
  bulkUpdatePrices,
  searchProductsForPricing,
  updateProductPrices,
  type PriceField,
  type BulkOp,
  type Rounding,
  type BulkPriceReport,
  type PricingRow,
} from "@/lib/actions/admin-prices";

type Cat = { id: string; name: string; parentId: string | null };

const FIELD_LABEL: Record<PriceField, string> = {
  b2cPrice: "Satış (B2C)",
  b2bPrice: "Bayi (B2B)",
  listPrice: "Liste",
};
const ALL_FIELDS: PriceField[] = ["b2cPrice", "b2bPrice", "listPrice"];

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

/** Kategorileri ağaç sırasına diz (girinti için depth ekle). */
function orderCats(cats: Cat[]): (Cat & { depth: number })[] {
  const byParent = new Map<string | null, Cat[]>();
  for (const c of cats) {
    const arr = byParent.get(c.parentId) ?? [];
    arr.push(c);
    byParent.set(c.parentId, arr);
  }
  const out: (Cat & { depth: number })[] = [];
  const walk = (c: Cat, d: number) => {
    out.push({ ...c, depth: d });
    for (const ch of byParent.get(c.id) ?? []) walk(ch, d + 1);
  };
  for (const c of byParent.get(null) ?? []) walk(c, 0);
  return out;
}

export function PriceManager({ categories }: { categories: Cat[] }) {
  const [tab, setTab] = useState<"bulk" | "single">("bulk");
  const ordered = useMemo(() => orderCats(categories), [categories]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <TabBtn active={tab === "bulk"} onClick={() => setTab("bulk")} icon={Layers} label="Kategori Bazlı (Toplu)" />
        <TabBtn active={tab === "single"} onClick={() => setTab("single")} icon={Package} label="Ürün Bazlı" />
      </div>
      {tab === "bulk" ? <BulkTab cats={ordered} /> : <SingleTab cats={ordered} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-navy text-paper" : "border border-line text-navy hover:border-orange"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

/* ============================ TOPLU ============================ */

function BulkTab({ cats }: { cats: (Cat & { depth: number })[] }) {
  const [categoryId, setCategoryId] = useState("ALL");
  const [includeSub, setIncludeSub] = useState(true);
  const [fields, setFields] = useState<PriceField[]>(["b2cPrice"]);
  const [op, setOp] = useState<BulkOp>("percent");
  const [value, setValue] = useState("");
  const [rounding, setRounding] = useState<Rounding>("none");
  const [report, setReport] = useState<BulkPriceReport | null>(null);
  const [pending, start] = useTransition();
  const [lastMode, setLastMode] = useState<"preview" | "apply" | null>(null);

  const canApply = report?.ok === true && report.dryRun === true && (report.affected ?? 0) > 0;

  const valLabel = op === "percent" ? "Yüzde (%) — indirim için eksi girin" : op === "amount" ? "Tutar (TL) — çıkarmak için eksi" : "Marj (%) — alış × (1 + marj)";
  const valPlaceholder = op === "percent" ? "örn. 10 veya -5" : op === "amount" ? "örn. 25 veya -10" : "örn. 30";

  function toggleField(f: PriceField) {
    setFields((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
    setReport(null);
  }

  function run(dryRun: boolean) {
    // %, ₺, TL, boşluk gibi işaretleri temizle ("%2" → 2, "-%5" → -5)
    const cleaned = String(value).replace(/[^\d.,-]/g, "").replace(",", ".");
    const num = Number(cleaned);
    if (cleaned === "" || !Number.isFinite(num)) {
      setReport({ error: "Geçerli bir değer girin." });
      return;
    }
    if (fields.length === 0) {
      setReport({ error: "En az bir fiyat alanı seçin." });
      return;
    }
    setLastMode(dryRun ? "preview" : "apply");
    start(async () => {
      const res = await bulkUpdatePrices({
        categoryId,
        includeSubcategories: includeSub,
        fields,
        op,
        value: num,
        rounding,
        dryRun,
      });
      setReport(res);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-line bg-paper p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Kategori */}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Kategori</span>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setReport(null); }}
              className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-orange"
            >
              <option value="ALL">Tüm ürünler</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {"  ".repeat(c.depth)}{c.depth > 0 ? "– " : ""}{c.name}
                </option>
              ))}
            </select>
          </label>

          {/* Alt kategoriler */}
          <label className={`flex items-center gap-2 self-end pb-2.5 text-sm ${categoryId === "ALL" ? "opacity-40" : ""}`}>
            <input
              type="checkbox"
              checked={includeSub}
              disabled={categoryId === "ALL"}
              onChange={(e) => { setIncludeSub(e.target.checked); setReport(null); }}
              className="h-4 w-4 accent-orange"
            />
            <span className="text-ink">Alt kategoriler dahil</span>
          </label>
        </div>

        {/* Fiyat alanları */}
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-ink">Uygulanacak fiyat alanları</p>
          <div className="flex flex-wrap gap-3">
            {ALL_FIELDS.map((f) => (
              <label key={f} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <input type="checkbox" checked={fields.includes(f)} onChange={() => toggleField(f)} className="h-4 w-4 accent-orange" />
                <span className="text-ink">{FIELD_LABEL[f]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* İşlem türü */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">İşlem türü</span>
            <select
              value={op}
              onChange={(e) => { setOp(e.target.value as BulkOp); setReport(null); }}
              className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-orange"
            >
              <option value="percent">Yüzde zam / indirim (%)</option>
              <option value="amount">Sabit tutar ekle / çıkar (TL)</option>
              <option value="margin">Maliyet + marj (alış bazlı)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">{valLabel}</span>
            <input
              value={value}
              onChange={(e) => { setValue(e.target.value); setReport(null); }}
              inputMode="decimal"
              placeholder={valPlaceholder}
              className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-orange"
            />
          </label>
        </div>

        {/* Yuvarlama */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Yuvarlama</span>
            <select
              value={rounding}
              onChange={(e) => { setRounding(e.target.value as Rounding); setReport(null); }}
              className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-orange"
            >
              <option value="none">Yok (kuruşlu)</option>
              <option value="integer">Tam sayıya</option>
              <option value="x90">,90 ile bitir</option>
              <option value="x95">,95 ile bitir</option>
            </select>
          </label>
        </div>

        {op === "margin" && (
          <p className="mt-3 rounded-lg bg-info/10 px-3 py-2 text-xs text-info">
            Marj işlemi seçili fiyatları <b>alış fiyatı × (1 + marj%)</b> ile yeniden hesaplar. Alış fiyatı olmayan ürünler atlanır.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-orange hover:text-orange disabled:opacity-50"
          >
            {pending && lastMode === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Önizle
          </button>
          <button
            type="button"
            disabled={!canApply || pending}
            onClick={() => {
              if (confirm(`${report?.affected} ürünün fiyatı güncellenecek. Devam edilsin mi?`)) run(false);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {pending && lastMode === "apply" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Uygula
          </button>
          {!canApply && !pending && report?.ok && (report.affected ?? 0) === 0 && (
            <span className="self-center text-xs text-muted">Değişecek ürün yok.</span>
          )}
        </div>
      </div>

      {report?.error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{report.error}</p>
      )}

      {report?.ok && (
        <div className="rounded-xl border border-line bg-paper p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${report.dryRun ? "bg-info/10 text-info" : "bg-success/10 text-success"}`}>
              {report.dryRun ? <><Eye className="h-3.5 w-3.5" /> ÖNİZLEME (kayıt yapılmadı)</> : <><CheckCircle2 className="h-3.5 w-3.5" /> UYGULANDI</>}
            </span>
          </div>
          <div className="mb-4 flex flex-wrap gap-6 text-sm">
            <span><b className="text-lg text-navy">{report.affected ?? 0}</b> ürün {report.dryRun ? "değişecek" : "güncellendi"}</span>
            <span className="text-muted"><b>{report.skipped ?? 0}</b> atlanan (değişmeyen/alış yok)</span>
          </div>

          {report.sample && report.sample.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-mist text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Ürün</th>
                    {ALL_FIELDS.map((f) => (
                      <th key={f} className="px-3 py-2 text-right font-semibold">{FIELD_LABEL[f]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {report.sample.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-ink">
                        {c.name}
                        {c.sku && <span className="ml-1 text-xs text-faint">({c.sku})</span>}
                      </td>
                      {ALL_FIELDS.map((f) => (
                        <td key={f} className="whitespace-nowrap px-3 py-1.5 text-right">
                          {c.after[f] != null ? (
                            <span>
                              <span className="text-faint line-through">{fmt(c.before[f])}</span>{" "}
                              <span className="font-semibold text-navy">{fmt(c.after[f])}</span>
                            </span>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {(report.affected ?? 0) > report.sample.length && (
                <p className="px-3 py-2 text-xs text-muted">…ve {(report.affected ?? 0) - report.sample.length} ürün daha (örnek ilk {report.sample.length} satır).</p>
              )}
            </div>
          )}

          {report.dryRun && (report.affected ?? 0) > 0 && (
            <p className="mt-4 text-sm text-muted">Uygun görünüyorsa <b>Uygula</b> ile kaydedin.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================ ÜRÜN BAZLI ============================ */

function SingleTab({ cats }: { cats: (Cat & { depth: number })[] }) {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [pending, start] = useTransition();
  const [searched, setSearched] = useState(false);

  function search() {
    setSearched(true);
    start(async () => {
      const res = await searchProductsForPricing(q, categoryId);
      setRows(res);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-line bg-paper p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Ara (ad / SKU)</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Ürün adı veya stok kodu…"
              className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-orange"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Kategori</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-orange"
            >
              <option value="ALL">Tümü</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {"  ".repeat(c.depth)}{c.depth > 0 ? "– " : ""}{c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={search}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Ara
          </button>
        </div>
      </div>

      {searched && !pending && rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-muted">Sonuç bulunamadı.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full text-sm">
            <thead className="bg-mist text-left text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Ürün</th>
                <th className="px-3 py-2 font-semibold">Satış (B2C)</th>
                <th className="px-3 py-2 font-semibold">Bayi (B2B)</th>
                <th className="px-3 py-2 font-semibold">Liste</th>
                <th className="px-3 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <PriceRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-xs text-muted">En fazla 60 sonuç · fiyatlar KDV hariç.</p>
        </div>
      )}
    </div>
  );
}

function PriceRow({ row }: { row: PricingRow }) {
  const [b2c, setB2c] = useState(String(row.b2cPrice));
  const [b2b, setB2b] = useState(row.b2bPrice != null ? String(row.b2bPrice) : "");
  const [list, setList] = useState(String(row.listPrice));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const numOrNull = (s: string) => {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  function save() {
    const nb2c = numOrNull(b2c);
    if (nb2c == null || nb2c <= 0) { setErr("Satış fiyatı"); return; }
    setErr(null);
    start(async () => {
      const res = await updateProductPrices({
        id: row.id,
        b2cPrice: nb2c,
        b2bPrice: numOrNull(b2b),
        listPrice: numOrNull(list) ?? nb2c,
      });
      if (res.error) setErr(res.error);
      else { setSaved(true); setTimeout(() => setSaved(false), 1500); }
    });
  }

  const inputCls = "w-24 rounded-md border border-line bg-paper px-2 py-1.5 text-right text-ink outline-none focus:border-orange";

  return (
    <tr className={err ? "bg-danger/5" : ""}>
      <td className="px-3 py-2 text-ink">
        {row.name}
        {row.sku && <span className="ml-1 text-xs text-faint">({row.sku})</span>}
        {row.categoryName && <span className="block text-xs text-muted">{row.categoryName}</span>}
      </td>
      <td className="px-3 py-2"><input value={b2c} onChange={(e) => setB2c(e.target.value)} inputMode="decimal" className={inputCls} /></td>
      <td className="px-3 py-2"><input value={b2b} onChange={(e) => setB2b(e.target.value)} inputMode="decimal" placeholder="—" className={inputCls} /></td>
      <td className="px-3 py-2"><input value={list} onChange={(e) => setList(e.target.value)} inputMode="decimal" className={inputCls} /></td>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
            saved ? "bg-success/15 text-success" : "bg-navy text-paper hover:bg-navy-600"
          }`}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "Kaydedildi" : "Kaydet"}
        </button>
      </td>
    </tr>
  );
}
