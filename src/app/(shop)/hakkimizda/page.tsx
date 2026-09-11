import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Truck, ShieldCheck, Users, Headset, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "AK Grup Yapı Malzemeleri — yapı ve hırdavatta profesyonel çözümler. Geniş ürün yelpazesi, uygun fiyat ve güvenilir hizmet.",
  alternates: { canonical: "/hakkimizda" },
};

const FEATURES = [
  { icon: Building2, title: "Geniş Ürün Yelpazesi", text: "Binlerce yapı malzemesi ve hırdavat ürünü tek adreste." },
  { icon: Truck, title: "Hızlı Teslimat", text: "Siparişleriniz özenle hazırlanıp en kısa sürede kargoya verilir." },
  { icon: ShieldCheck, title: "Güvenilir Alışveriş", text: "Güvenli ödeme ve şeffaf fiyatlandırma ile içiniz rahat." },
  { icon: Users, title: "Bayi & Perakende", text: "Hem kurumsal bayilere hem son kullanıcıya özel fiyat ve hizmet." },
];

export default async function AboutPage() {
  const s = await getSettings();

  return (
    <div className="container-ak py-8">
      <Breadcrumb items={[{ label: "Hakkımızda" }]} />

      <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-navy to-navy-dark p-8 text-paper sm:p-10">
        <h1 className="text-2xl font-bold sm:text-3xl">{s.companyName}</h1>
        <p className="mt-3 max-w-2xl text-mist/80">
          {s.data.aboutShort ||
            "Yapı ve hırdavatta profesyonel çözümler sunuyoruz. Kaliteli ürünleri uygun fiyatlarla, güvenilir ve hızlı hizmet anlayışıyla buluşturuyoruz."}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-ink">Biz Kimiz?</h2>
          <div className="mt-3 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              {s.companyName}, inşaat ve tadilat projelerinden günlük hırdavat ihtiyaçlarına kadar
              geniş bir ürün yelpazesini müşterileriyle buluşturan bir yapı malzemeleri tedarikçisidir.
              Boya, elektrikli el aletleri, tesisat, izolasyon, nalburiye ve daha birçok kategoride
              binlerce ürünü stoklarımızda bulunduruyoruz.
            </p>
            <p>
              Hem <strong>kurumsal bayilerimize</strong> özel fiyatlandırma ve vadeli çalışma imkânı
              sunuyor, hem de <strong>son kullanıcılarımıza</strong> perakende satışta kaliteli ürün ve
              uygun fiyat garantisi veriyoruz. Amacımız; doğru ürünü, doğru fiyata, zamanında teslim etmek.
            </p>
            <p>
              Deneyimli ekibimiz ve müşteri odaklı hizmet anlayışımızla, satın alma sürecinizin her
              aşamasında yanınızdayız. Sorularınız için bize her zaman ulaşabilirsiniz.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/kategoriler"
              className="inline-flex items-center gap-2 rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Ürünleri Keşfet <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-orange hover:text-orange"
            >
              <Headset className="h-4 w-4" /> İletişime Geç
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-paper p-5">
          <h3 className="mb-3 font-bold text-ink">İletişim</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><span className="font-medium text-ink">{s.companyName}</span></li>
            <li>Tel: {s.phone}</li>
            {s.email && <li>E-posta: {s.email}</li>}
            {s.address && <li>{s.address}</li>}
            {s.data.workingHours && <li>{s.data.workingHours}</li>}
          </ul>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-line bg-paper p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <f.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-3 font-bold text-ink">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
