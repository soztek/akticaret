"use client";

import { useRouter } from "next/navigation";
import type { SortKey } from "@/lib/catalog";

const DEFAULT_PER = 50;

export function PerPageSelect({
  options,
  value,
  sort,
}: {
  options: number[];
  value: number;
  sort: SortKey;
}) {
  const router = useRouter();

  function go(per: number) {
    const p = new URLSearchParams();
    if (sort !== "new") p.set("sirala", sort);
    if (per !== DEFAULT_PER) p.set("goster", String(per));
    const qs = p.toString();
    router.push(qs ? `/urunler?${qs}` : "/urunler");
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Göster:</span>
      <select
        value={value}
        onChange={(e) => go(Number(e.target.value))}
        className="rounded-lg border border-line bg-paper px-3 py-1.5 font-medium text-navy outline-none transition focus:border-orange"
        aria-label="Sayfa başına ürün sayısı"
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n} ürün
          </option>
        ))}
      </select>
    </label>
  );
}
