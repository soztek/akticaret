import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Tag, ShieldCheck } from "lucide-react";

const BADGES = [
  { icon: BadgeCheck, label: "Kaliteli Ürün" },
  { icon: Tag, label: "Uygun Fiyat" },
  { icon: ShieldCheck, label: "Güvenilir Hizmet" },
];

/**
 * Ana sayfa hero'su — tam genişlik mağaza fotoğrafı + sol lacivert gölge.
 * Görsel firmanın kendi tanıtım materyalinden (mağaza sahnesi). imageUrl
 * banner tablosundan gelirse onu, yoksa `/hero-magaza.jpg` kullanır.
 */
export function Hero({ imageUrl }: { imageUrl?: string | null }) {
  const src = imageUrl || "/hero-magaza.jpg";

  return (
    <section className="relative overflow-hidden bg-navy-dark text-paper">
      {/* Arka plan foto */}
      <Image
        src={src}
        alt="AK TİCARET Yapı Malzemeleri mağazası"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Lacivert gölge: solda güçlü → sağa şeffaf (metin okunurluğu) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy-dark/85 to-navy-dark/20 md:to-transparent"
      />
      <div aria-hidden className="absolute inset-0 bg-navy-dark/40 md:hidden" />

      <div className="container-ak relative">
        <div className="max-w-xl py-12 md:py-20 lg:py-24">
          <span className="inline-block rounded-full bg-orange/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-light ring-1 ring-orange/30">
            AK TİCARET Yapı Malzemeleri
          </span>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight drop-shadow sm:text-4xl lg:text-5xl">
            SAĞLAM YAPILAR,
            <br />
            <span className="text-orange">GÜVENLİ YARINLAR</span>
          </h1>
          <p className="mt-4 max-w-md text-mist/85">
            Temelden çatıya, ihtiyacınız olan her şey burada. Çimento, demir,
            hırdavat, boya, tesisat ve daha fazlası — bayilere özel fiyatlarla.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {BADGES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-sm font-medium">
                <Icon className="h-4 w-4 text-orange-light" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/kategoriler"
              className="inline-flex items-center gap-2 rounded-lg bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/25 transition hover:bg-orange-600"
            >
              ÜRÜNLERİ KEŞFET <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/bayi/basvuru"
              className="inline-flex items-center gap-2 rounded-lg border border-paper/30 bg-navy-dark/30 px-6 py-3.5 font-semibold text-paper backdrop-blur-sm transition hover:border-orange"
            >
              BAYİLİK BAŞVURUSU
            </Link>
          </div>

          <div className="mt-8 flex gap-2">
            <span className="h-2 w-6 rounded-full bg-orange" />
            <span className="h-2 w-2 rounded-full bg-paper/40" />
            <span className="h-2 w-2 rounded-full bg-paper/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
