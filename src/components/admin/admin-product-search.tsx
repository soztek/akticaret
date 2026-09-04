"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/** Canlı (anlık) ürün araması — yazdıkça debounce ile URL'yi günceller (submit yok). */
export function AdminProductSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const q = value.trim();
      // Arama değişince sayfa 1'e dön (page paramı düşer)
      router.replace(q ? `/admin/urunler?q=${encodeURIComponent(q)}` : "/admin/urunler");
    }, 250);
    return () => clearTimeout(t);
  }, [value, router]);

  return (
    <div className="relative w-full sm:w-80">
      <Search
        size={17}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ürün ara…"
        className="w-full rounded-full border border-line bg-paper py-2.5 pl-10 pr-10 text-sm text-ink outline-none placeholder:text-faint focus:border-orange focus:ring-2 focus:ring-orange/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          aria-label="Temizle"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
