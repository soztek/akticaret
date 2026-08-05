import Link from "next/link";
import { Package, ShieldCheck, Percent } from "lucide-react";

/** Ana sayfa 3'lü kampanya banner şeridi (referans tasarım). */
export function PromoBanners() {
  return (
    <div className="container-ak grid gap-4 py-2 md:grid-cols-3">
      {/* Marka indirimi (koyu) */}
      <Link
        href="/kategori/hirdavat"
        className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-navy p-5 text-paper transition hover:shadow-lg"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-light">
            Bosch
          </span>
          <p className="mt-1 text-sm text-mist/80">Elektrikli El Aletlerinde</p>
          <p className="mt-1 text-2xl font-extrabold text-orange">%20 İNDİRİM</p>
          <span className="mt-3 inline-block rounded-md bg-orange px-3 py-1.5 text-xs font-semibold text-white">
            Alışverişe Başla
          </span>
        </div>
        <Percent className="h-16 w-16 shrink-0 text-white/10 transition group-hover:text-white/20" />
      </Link>

      {/* Kargo bedava (turuncu) */}
      <Link
        href="/kampanyalar"
        className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-br from-orange to-orange-light p-5 text-white transition hover:shadow-lg"
      >
        <div>
          <p className="text-lg font-bold">1.000 TL ÜZERİ ALIŞVERİŞLERDE</p>
          <p className="mt-1 text-3xl font-extrabold">KARGO BEDAVA</p>
        </div>
        <Package className="h-16 w-16 shrink-0 text-white/25 transition group-hover:text-white/40" />
      </Link>

      {/* Çimento & Demir (koyu) */}
      <Link
        href="/kategori/insaat-malzemeleri"
        className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-navy p-5 text-paper transition hover:shadow-lg"
      >
        <div>
          <p className="text-lg font-bold">ÇİMENTO, DEMİR & İNŞAATTA</p>
          <p className="mt-1 text-2xl font-extrabold text-orange-light">TOPTAN FİYATLAR</p>
          <span className="mt-3 inline-block rounded-md border border-paper/30 px-3 py-1.5 text-xs font-semibold">
            Ürünleri İncele
          </span>
        </div>
        <ShieldCheck className="h-16 w-16 shrink-0 text-white/10 transition group-hover:text-white/20" />
      </Link>
    </div>
  );
}
