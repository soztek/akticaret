"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Store,
  FileText,
  Tag,
  Settings,
  Boxes,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/urunler", label: "Ürünler", icon: Package },
  { href: "/admin/kategoriler", label: "Kategoriler", icon: FolderTree },
  { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingBag },
  { href: "/admin/bayiler", label: "Bayiler", icon: Store },
  { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
  { href: "/admin/teklifler", label: "Teklifler", icon: FileText },
  { href: "/admin/kampanyalar", label: "Kampanyalar", icon: Tag },
  { href: "/admin/stok", label: "Stok", icon: Boxes },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-orange text-white" : "text-mist/80 hover:bg-navy-600 hover:text-white",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
