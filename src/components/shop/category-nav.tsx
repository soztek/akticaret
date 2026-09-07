import Link from "next/link";
import { Menu } from "lucide-react";
import type { NavCategory } from "@/lib/catalog";

/** Lacivert kategori navigasyonu — üst kategoriler + hover'da alt menü (CSS group-hover). */
export function CategoryNav({ categories }: { categories: NavCategory[] }) {
  return (
    <nav className="hidden bg-navy text-paper lg:block">
      <div className="container-ak flex items-stretch gap-1">
        {/* Tüm Kategoriler — sabit, açılır menüde 9 kategorinin tümü + alt kategoriler */}
        <div className="group relative shrink-0">
          <button className="flex items-center gap-2 bg-orange px-4 py-3 text-sm font-semibold">
            <Menu className="h-4 w-4" /> Tüm Kategoriler
          </button>
          <div className="invisible absolute left-0 top-full z-40 w-72 rounded-b-lg bg-paper py-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
            {categories.map((c) => (
              <div key={c.id} className="group/sub relative">
                <Link
                  href={`/kategori/${c.slug}`}
                  className="block px-4 py-2 text-sm text-ink hover:bg-mist hover:text-orange"
                >
                  {c.name}
                </Link>
                {c.children.length > 0 && (
                  <div className="invisible absolute left-full top-0 z-50 w-64 rounded-lg bg-paper py-2 opacity-0 shadow-xl transition group-hover/sub:visible group-hover/sub:opacity-100">
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
          </div>
        </div>

        {/* Kaydırılabilir orta alan — Ana Sayfa + tüm kategoriler tek satır */}
        <div className="flex flex-1 items-stretch gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/"
            className="shrink-0 whitespace-nowrap px-3 py-3 text-sm font-medium hover:text-orange-light"
          >
            Ana Sayfa
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/kategori/${c.slug}`}
              className="shrink-0 whitespace-nowrap px-3 py-3 text-sm font-medium hover:text-orange-light"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Kampanyalar — kaydırma alanının dışında, sağda sabit */}
        <Link
          href="/kampanyalar"
          className="flex shrink-0 items-center whitespace-nowrap px-3 py-3 text-sm font-bold text-orange-light hover:text-orange"
        >
          🔥 Kampanyalar
        </Link>
      </div>
    </nav>
  );
}
