import Link from "next/link";
import { Menu } from "lucide-react";
import type { NavCategory } from "@/lib/catalog";

/** Lacivert kategori navigasyonu — üst kategoriler + hover'da alt menü (CSS group-hover). */
export function CategoryNav({ categories }: { categories: NavCategory[] }) {
  return (
    <nav className="hidden bg-navy text-paper lg:block">
      <div className="container-ak flex items-stretch gap-1">
        <div className="group relative">
          <button className="flex items-center gap-2 bg-orange px-4 py-3 text-sm font-semibold">
            <Menu className="h-4 w-4" /> Tüm Kategoriler
          </button>
          <div className="invisible absolute left-0 top-full z-40 w-64 rounded-b-lg bg-paper py-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/kategori/${c.slug}`}
                className="block px-4 py-2 text-sm text-ink hover:bg-mist hover:text-orange"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        <Link href="/" className="px-3 py-3 text-sm font-medium hover:text-orange-light">
          Ana Sayfa
        </Link>

        {categories.slice(0, 7).map((c) => (
          <div key={c.id} className="group relative">
            <Link
              href={`/kategori/${c.slug}`}
              className="block px-3 py-3 text-sm font-medium hover:text-orange-light"
            >
              {c.name}
            </Link>
            {c.children.length > 0 && (
              <div className="invisible absolute left-0 top-full z-40 w-60 rounded-b-lg bg-paper py-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                {c.children.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/kategori/${sub.slug}`}
                    className="block px-4 py-2 text-sm text-ink hover:bg-mist hover:text-orange"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        <Link
          href="/kampanyalar"
          className="ml-auto px-3 py-3 text-sm font-bold text-orange-light hover:text-orange"
        >
          🔥 Kampanyalar
        </Link>
      </div>
    </nav>
  );
}
