import Link from "next/link";
import { Phone, MessageCircle, MapPin, Clock } from "lucide-react";
import { Logo } from "@/components/logo";
import { getSettings, waNumber, telNumber } from "@/lib/settings";
import { getNavCategories } from "@/lib/catalog";

const KURUMSAL = [
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
  { label: "KVKK", href: "/kvkk" },
  { label: "Gizlilik", href: "/gizlilik" },
  { label: "Mesafeli Satış", href: "/mesafeli-satis" },
  { label: "İade Koşulları", href: "/iade" },
];

const HIZMET = [
  { label: "Sipariş Takibi", href: "/siparis-takibi" },
  { label: "Kargo", href: "/kargo" },
  { label: "İade", href: "/iade" },
  { label: "Sıkça Sorulan Sorular", href: "/sss" },
];

function Col({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-orange-light">{title}</h3>
      <ul className="space-y-2 text-sm text-mist/70">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-paper">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer() {
  const [s, navCats] = await Promise.all([getSettings(), getNavCategories()]);
  const kategoriler = navCats.slice(0, 6).map((c) => ({ label: c.name, href: `/kategori/${c.slug}` }));
  return (
    <footer className="mt-12 bg-navy-dark text-paper">
      <div className="container-ak grid grid-cols-2 gap-8 py-12 md:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <Logo variant="boxed" />
          <p className="mt-4 text-sm text-mist/70">
            {s.data.aboutShort ||
              "Yapı ve hırdavatta profesyonel çözümler. Kaliteli ürünler, uygun fiyatlar ve profesyonel hizmet."}
          </p>
        </div>
        <Col title="Kurumsal" links={KURUMSAL} />
        <Col title="Müşteri Hizmetleri" links={HIZMET} />
        <Col title="Kategoriler" links={kategoriler} />
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-orange-light">
            İletişim
          </h3>
          <p className="mb-3 text-sm font-semibold">{s.companyName}</p>
          <ul className="space-y-2 text-sm text-mist/70">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-orange" />
              <a href={`tel:${telNumber(s.phone)}`} className="hover:text-paper">{s.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-success" />
              <a
                href={`https://wa.me/${waNumber(s.whatsapp)}`}
                className="hover:text-paper"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp: {s.phone}
              </a>
            </li>
            {s.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-orange" />
                <span>{s.address}</span>
              </li>
            )}
            {s.data.workingHours && (
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-orange" />
                <span>{s.data.workingHours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-400/40">
        <div className="container-ak flex flex-col items-center justify-between gap-2 py-4 text-xs text-mist/60 sm:flex-row">
          <span>© {new Date().getFullYear()} {s.companyName}. Tüm hakları saklıdır.</span>
          <span>Lacivert + Turuncu kurumsal kimlik</span>
        </div>
      </div>
    </footer>
  );
}
