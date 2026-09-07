"use client";

import { useState, useTransition, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Download, Eye, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { importProducts, type ImportReport } from "@/lib/actions/admin-import";

const TEMPLATE_HEADERS = [
  "SKU",
  "Ürün Adı",
  "Barkod",
  "Kategori",
  "Marka",
  "Liste Fiyatı",
  "Satış Fiyatı",
  "Bayi Fiyatı",
  "Alış Fiyatı",
  "KDV",
  "Stok",
  "Birim",
  "Kısa Açıklama",
  "Aktif",
];
const TEMPLATE_SAMPLE = [
  "AK-1001",
  "Örnek Ürün 10mm",
  "8690000000001",
  "Vida",
  "AK Ticaret",
  "120,00",
  "99,90",
  "89,90",
  "70,00",
  "20",
  "150",
  "adet",
  "Kısa ürün açıklaması",
  "Evet",
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS.join(";"), TEMPLATE_SAMPLE.join(";")];
  const csv = "﻿" + rows.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "urun-import-sablonu.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [pending, start] = useTransition();
  const [lastMode, setLastMode] = useState<"preview" | "import" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canImport = report?.ok === true && report.dryRun === true && (report.totalRows ?? 0) > 0;

  function run(dryRun: boolean) {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("dryRun", dryRun ? "1" : "0");
    setLastMode(dryRun ? "preview" : "import");
    start(async () => {
      const res = await importProducts(undefined, fd);
      setReport(res);
    });
  }

  function onPickFile(f: File | null) {
    setFile(f);
    setReport(null);
    setLastMode(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Yükleme kutusu */}
      <div className="rounded-xl border border-line bg-paper p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-ink">Excel / CSV Dosyası</h2>
            <p className="text-sm text-muted">.xlsx, .xls veya .csv — SKU (stok kodu) ile eşleştirilir.</p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-navy hover:border-orange hover:text-orange"
          >
            <Download className="h-4 w-4" /> Örnek şablon indir
          </button>
        </div>

        <label
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-mist/40 px-4 py-8 text-center transition hover:border-orange"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <FileSpreadsheet className="h-8 w-8 text-orange" />
              <span className="text-sm font-semibold text-ink">{file.name}</span>
              <span className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB · değiştirmek için tıklayın</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted" />
              <span className="text-sm font-semibold text-ink">Dosya seçmek için tıklayın</span>
              <span className="text-xs text-muted">veya buraya sürükleyin</span>
            </>
          )}
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!file || pending}
            onClick={() => run(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-orange hover:text-orange disabled:opacity-50"
          >
            {pending && lastMode === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Önizle (deneme)
          </button>
          <button
            type="button"
            disabled={!canImport || pending}
            onClick={() => {
              if (confirm("Ürünler içe aktarılacak (yeni ürünler oluşturulacak, mevcutlar güncellenecek). Devam edilsin mi?")) run(false);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {pending && lastMode === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            İçe Aktar
          </button>
          {!canImport && file && !pending && (
            <span className="self-center text-xs text-muted">Önce “Önizle” ile kontrol edin.</span>
          )}
        </div>
      </div>

      {/* Rapor */}
      {report?.error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{report.error}</span>
        </div>
      )}

      {report?.ok && <Report report={report} />}
    </div>
  );
}

function Report({ report }: { report: ImportReport }) {
  const preview = report.dryRun;
  return (
    <div className="rounded-xl border border-line bg-paper p-5">
      <div className="mb-4 flex items-center gap-2">
        {preview ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1 text-xs font-bold text-info">
            <Eye className="h-3.5 w-3.5" /> ÖNİZLEME (kayıt yapılmadı)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> İÇE AKTARILDI
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Toplam Satır" value={report.totalRows ?? 0} tone="navy" />
        <Tile label={preview ? "Oluşturulacak" : "Oluşturuldu"} value={report.created ?? 0} tone="success" />
        <Tile label={preview ? "Güncellenecek" : "Güncellendi"} value={report.updated ?? 0} tone="info" />
        <Tile label="Atlanan" value={report.skipped ?? 0} tone={(report.skipped ?? 0) > 0 ? "danger" : "muted"} />
      </div>

      {report.createdBrands && report.createdBrands.length > 0 && (
        <p className="mt-4 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
          {preview ? "Oluşturulacak yeni markalar" : "Oluşturulan markalar"}: {report.createdBrands.join(", ")}
        </p>
      )}

      {report.missingCategories && report.missingCategories.length > 0 && (
        <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
          Bulunamayan kategoriler (boş bırakıldı): {report.missingCategories.join(", ")}
          <br />
          <span className="text-xs text-muted">Kategoriler otomatik oluşturulmaz; önce Kategoriler bölümünden ekleyin.</span>
        </p>
      )}

      {report.errors && report.errors.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-danger">Atlanan satırlar ({report.errors.length})</p>
          <div className="max-h-72 overflow-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead className="bg-mist text-left text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Satır</th>
                  <th className="px-3 py-2 font-semibold">SKU</th>
                  <th className="px-3 py-2 font-semibold">Sebep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.errors.map((e, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 text-muted">{e.row}</td>
                    <td className="px-3 py-1.5 font-medium text-ink">{e.sku || "—"}</td>
                    <td className="px-3 py-1.5 text-danger">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {preview && (report.totalRows ?? 0) > 0 && (
        <p className="mt-4 text-sm text-muted">
          Sonuçlar uygun görünüyorsa yukarıdaki <b>İçe Aktar</b> butonuyla kaydedin.
        </p>
      )}
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone: "navy" | "success" | "info" | "danger" | "muted" }) {
  const c =
    tone === "success" ? "text-success" : tone === "info" ? "text-info" : tone === "danger" ? "text-danger" : tone === "navy" ? "text-navy" : "text-muted";
  return (
    <div className="rounded-lg border border-line bg-mist/30 p-3 text-center">
      <p className={`text-2xl font-extrabold ${c}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
