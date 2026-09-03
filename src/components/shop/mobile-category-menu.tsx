"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight, ChevronDown } from "lucide-react";
import { CategoryIcon } from "@/components/shop/category-icon";
import type { NavCategory } from "@/lib/catalog";

/**
 * Mobil "TÜM KATEGORİLER" menüsü — sadece mobil/tablet (lg altı).
 * Bar'a basınca soldan çekmece açılır; alt kategorisi olanlar akordeon açılır.
 */
export function MobileCategoryMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="lg:hidden">
      {/* Tetikleyici bar */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 bg-navy-dark px-4 py-3 text-sm font-bold uppercase tracking-wide text-paper"
      >
        <Menu className="h-5 w-5" /> TÜM KATEGORİLER
      </button>

      {/* Çekmece */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-paper shadow-xl">
            <div className="flex items-center justify-between bg-navy-dark px-4 py-3 text-paper">
              <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                <Menu className="h-5 w-5" /> Tüm Kategoriler
              </span>
              <button onClick={() => setOpen(false)} aria-label="Kapat">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-line">
                {categories.map((c) => {
                  const hasChildren = c.children.length > 0;
                  const isOpen = expanded === c.id;
                  return (
                    <li key={c.id}>
                      <div className="flex items-center">
                        <Link
                          href={`/kategori/${c.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex flex-1 items-center gap-3 px-4 py-3 text-sm text-ink"
                        >
                          <CategoryIcon name={c.icon} className="h-5 w-5 text-navy" />
                          <span className="font-medium">{c.name}</span>
                        </Link>
                        {hasChildren && (
                          <button
                            onClick={() => setExpanded(isOpen ? null : c.id)}
                            aria-label={isOpen ? "Kapat" : "Alt kategoriler"}
                            className="px-4 py-3 text-muted"
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {hasChildren && isOpen && (
                        <ul className="bg-mist">
                          {c.children.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={`/kategori/${sub.slug}`}
                                onClick={() => setOpen(false)}
                                className="block py-2.5 pl-12 pr-4 text-sm text-muted hover:text-orange"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
