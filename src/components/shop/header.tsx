import Link from "next/link";
import { User, Heart, ShoppingCart } from "lucide-react";
import { Logo } from "@/components/logo";
import { SearchBar } from "@/components/shop/search-bar";
import { CategoryNav } from "@/components/shop/category-nav";
import { CartBadge } from "@/components/shop/cart-badge";
import { getNavCategories } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";

export async function Header() {
  const [categories, user] = await Promise.all([getNavCategories(), getCurrentUser()]);
  const accountHref = user ? (isStaffRole(user.role) ? "/admin" : "/hesabim") : "/giris";

  return (
    <header className="sticky top-0 z-40">
      {/* Üst bilgi barı */}
      <div className="bg-navy-dark text-mist/80">
        <div className="container-ak flex items-center justify-between py-1.5 text-xs">
          <span>Yapı ve hırdavatta profesyonel çözümler</span>
          <a href="tel:+905385832704" className="hidden font-medium hover:text-orange-light sm:inline">
            📞 0538 583 27 04
          </a>
        </div>
      </div>

      {/* Ana bar */}
      <div className="bg-navy">
        <div className="container-ak flex items-center gap-4 py-3">
          <Logo variant="boxed" priority />

          <div className="hidden flex-1 md:block">
            <SearchBar />
          </div>

          <div className="ml-auto flex items-center gap-1 text-paper md:ml-0">
            <Link
              href={accountHref}
              className="flex flex-col items-center rounded-md px-3 py-1.5 hover:bg-navy-600"
            >
              <User className="h-5 w-5" />
              <span className="mt-0.5 hidden text-xs sm:block">
                {user ? "Hesabım" : "Giriş"}
              </span>
            </Link>
            <Link
              href="/hesabim/favoriler"
              className="flex flex-col items-center rounded-md px-3 py-1.5 hover:bg-navy-600"
            >
              <Heart className="h-5 w-5" />
              <span className="mt-0.5 hidden text-xs sm:block">Favoriler</span>
            </Link>
            <Link
              href="/sepet"
              className="relative flex flex-col items-center rounded-md px-3 py-1.5 hover:bg-navy-600"
            >
              <span className="relative">
                <ShoppingCart className="h-5 w-5" />
                <CartBadge />
              </span>
              <span className="mt-0.5 hidden text-xs sm:block">Sepet</span>
            </Link>
          </div>
        </div>

        {/* Mobil arama */}
        <div className="container-ak pb-3 md:hidden">
          <SearchBar />
        </div>
      </div>

      <CategoryNav categories={categories} />
    </header>
  );
}
