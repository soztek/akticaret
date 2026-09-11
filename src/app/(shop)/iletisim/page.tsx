import type { Metadata } from "next";
import { Phone, MessageCircle, Mail, MapPin, Clock, Camera } from "lucide-react";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { getSettings, waNumber, telNumber } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "İletişim",
  description: "AK Grup Yapı Malzemeleri ile iletişime geçin — telefon, WhatsApp, e-posta ve adres bilgileri.",
  alternates: { canonical: "/iletisim" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const wa = waNumber(s.whatsapp);
  const mapsHref = s.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`
    : null;

  return (
    <div className="container-ak py-8">
      <Breadcrumb items={[{ label: "İletişim" }]} />

      <h1 className="mt-6 text-2xl font-bold text-ink sm:text-3xl">İletişim</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Ürünler, siparişler veya bayilik hakkında her türlü sorunuz için bize ulaşın. Size en kısa
        sürede yardımcı olalım.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Telefon */}
        <a
          href={`tel:${telNumber(s.phone)}`}
          className="flex items-start gap-3 rounded-xl border border-line bg-paper p-5 transition hover:border-orange hover:shadow-sm"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange">
            <Phone className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-bold text-ink">Telefon</span>
            <span className="text-sm text-muted">{s.phone}</span>
          </span>
        </a>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-xl border border-line bg-paper p-5 transition hover:border-success hover:shadow-sm"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <MessageCircle className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-bold text-ink">WhatsApp</span>
            <span className="text-sm text-muted">{s.phone} · Hemen yazın</span>
          </span>
        </a>

        {/* E-posta */}
        {s.email && (
          <a
            href={`mailto:${s.email}`}
            className="flex items-start gap-3 rounded-xl border border-line bg-paper p-5 transition hover:border-orange hover:shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <Mail className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-bold text-ink">E-posta</span>
              <span className="text-sm text-muted">{s.email}</span>
            </span>
          </a>
        )}

        {/* Instagram */}
        {s.instagram && (
          <a
            href={s.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl border border-line bg-paper p-5 transition hover:border-orange hover:shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <Camera className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-bold text-ink">Instagram</span>
              <span className="text-sm text-muted">Bizi takip edin</span>
            </span>
          </a>
        )}

        {/* Adres */}
        {s.address && (
          <a
            href={mapsHref!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl border border-line bg-paper p-5 transition hover:border-orange hover:shadow-sm sm:col-span-2"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <MapPin className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-bold text-ink">Adres</span>
              <span className="text-sm text-muted">{s.address}</span>
              <span className="mt-1 block text-xs font-semibold text-orange">Haritada aç →</span>
            </span>
          </a>
        )}

        {/* Çalışma saatleri */}
        {s.data.workingHours && (
          <div className="flex items-start gap-3 rounded-xl border border-line bg-paper p-5 sm:col-span-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy">
              <Clock className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-bold text-ink">Çalışma Saatleri</span>
              <span className="text-sm text-muted">{s.data.workingHours}</span>
            </span>
          </div>
        )}
      </div>

      <a
        href={`https://wa.me/${wa}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-success px-6 py-3 font-semibold text-white transition hover:brightness-110"
      >
        <MessageCircle className="h-5 w-5" /> WhatsApp'tan Yaz
      </a>
    </div>
  );
}
