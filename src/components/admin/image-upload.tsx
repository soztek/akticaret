"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";

/** Görsel yükleme: seçince /api/admin/upload'a POST eder, url'yi gizli input'a yazar. */
export function ImageUpload({
  name = "imageUrl",
  defaultUrl = null,
}: {
  name?: string;
  defaultUrl?: string | null;
}) {
  const [url, setUrl] = useState<string | null>(defaultUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yükleme başarısız");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url ?? ""} />
      <div className="flex items-center gap-4">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-mist">
          {url ? (
            <>
              <Image src={url} alt="Ürün görseli" fill className="object-contain" sizes="112px" />
              <button
                type="button"
                onClick={() => setUrl(null)}
                className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-white hover:bg-danger"
                aria-label="Görseli kaldır"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-orange" />
          ) : (
            <UploadCloud className="h-7 w-7 text-faint" />
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-orange hover:text-orange disabled:opacity-50"
          >
            {loading ? "Yükleniyor…" : url ? "Görseli Değiştir" : "Görsel Yükle"}
          </button>
          <p className="mt-1 text-xs text-muted">JPG, PNG, WebP · maks. 8MB</p>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
    </div>
  );
}
