"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingCart, User } from "lucide-react";
import { clsx } from "clsx";

const ITEMS = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/kategoriler", label: "Kategoriler", icon: LayoutGrid },
  { href: "/arama", label: "Ara", icon: Search },
  { href: "/sepet", label: "Sepet", icon: ShoppingCart },
  { href: "/hesabim", label: "Hesabım", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper lg:hidden">
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                  active ? "text-orange" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
