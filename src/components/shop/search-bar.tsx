"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { formatTL } from "@/lib/format";
import type { ProductCardData } from "@/lib/catalog";

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductCardData[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      setOpen(false);
      router.push(`/arama?q=${encodeURIComponent(q.trim())}`);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Ürün, marka veya kod ara…"
          className="w-full rounded-lg border border-transparent bg-paper py-2.5 pl-4 pr-11 text-sm text-ink outline-none focus:border-orange"
          aria-label="Ürün ara"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-orange text-white hover:bg-orange-600"
          aria-label="Ara"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 max-h-96 w-full overflow-auto rounded-lg border border-line bg-paper py-2 shadow-xl">
          {results.slice(0, 8).map((p) => (
            <Link
              key={p.id}
              href={`/urun/${p.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-mist"
            >
              <span className="line-clamp-1 text-ink">{p.name}</span>
              <span className="whitespace-nowrap font-semibold text-navy">
                {formatTL(p.b2cPrice)}
              </span>
            </Link>
          ))}
          <button
            onClick={submit}
            className="mt-1 w-full border-t border-line px-4 pt-2 text-left text-sm font-semibold text-orange"
          >
            Tüm sonuçları gör →
          </button>
        </div>
      )}
    </div>
  );
}
