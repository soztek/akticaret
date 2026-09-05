"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2, Star } from "lucide-react";

/**
 * Çoklu ürün görseli yükleme. Sıradaki ilk görsel KAPAK (primary).
 * Her url için gizli input (name) → sunucuda getAll(name) ile dizi alınır.
 */
export function MultiImageUpload({
  name = "imageUrls",
  defaultUrls = [],
}: {
  name?: string;
  defaultUrls?: string[];
}) {
  const [urls, setUrls] = useState<string[]>(defaultUrls);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setLoading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Yükleme başarısız");
        uploaded.push(data.url);
      }
      setUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const remove = (url: string) => setUrls((prev) => prev.filter((u) => u !== url));
  const makeCover = (url: string) => setUrls((prev) => [url, ...prev.filter((u) => u !== url)]);

  return (
    <div>
      {urls.map((u) => (
        <input key={u} type="hidden" name={name} value={u} />
      ))}

      <div className="flex flex-wrap gap-3">
        {urls.map((u, i) => (
          <div
            key={u}
            className="group relative h-24 w-24 overflow-hidden rounded-lg border border-line bg-mist"
          >
            <Image src={u} alt={`Görsel ${i + 1}`} fill className="object-contain" sizes="96px" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-orange px-1.5 py-0.5 text-[9px] font-bold text-white">
                KAPAK
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/60 px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
              {i !== 0 ? (
                <button
                  type="button"
                  onClick={() => makeCover(u)}
                  title="Kapak yap"
                  className="text-white hover:text-orange-light"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => remove(u)}
                title="Kaldır"
                className="text-white hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-muted hover:border-orange hover:text-orange disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <UploadCloud className="h-6 w-6" />
              <span className="text-[11px] font-medium">Görsel Ekle</span>
            </>
          )}
        </button>
      </div>

      <p className="mt-1.5 text-xs text-muted">
        Birden fazla seçebilirsiniz · JPG/PNG/WebP · maks. 8MB · ilk görsel kapaktır
      </p>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFiles}
        className="hidden"
      />
    </div>
  );
}
