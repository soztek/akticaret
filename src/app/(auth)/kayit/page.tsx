"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { User, Building2 } from "lucide-react";
import { registerAction, registerDealerAction, type AuthState } from "@/lib/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/form";

type Mode = "individual" | "dealer";

export default function RegisterPage() {
  const [mode, setMode] = useState<Mode>("individual");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Üye Ol</h1>
        <p className="mt-1 text-sm text-muted">Hesap türünüzü seçerek kayıt olun.</p>
      </div>

      {/* Hesap türü seçimi */}
      <div className="grid grid-cols-2 gap-3">
        <TypeCard
          active={mode === "individual"}
          onClick={() => setMode("individual")}
          icon={User}
          title="Bireysel"
          desc="Son kullanıcı hesabı"
        />
        <TypeCard
          active={mode === "dealer"}
          onClick={() => setMode("dealer")}
          icon={Building2}
          title="Bayi (Kurumsal)"
          desc="Firma / bayi hesabı"
        />
      </div>

      {mode === "individual" ? <IndividualForm /> : <DealerForm />}

      <p className="text-center text-sm text-muted">
        Zaten üye misiniz?{" "}
        <Link href="/giris" className="font-semibold text-orange hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  );
}

function TypeCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
        active
          ? "border-orange bg-orange/5 ring-1 ring-orange"
          : "border-line bg-paper hover:border-orange/50"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-orange" : "text-muted"}`} />
      <span className="text-sm font-semibold text-ink">{title}</span>
      <span className="text-xs text-muted">{desc}</span>
    </button>
  );
}

function IndividualForm() {
  const [state, action] = useActionState<AuthState, FormData>(registerAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <Field label="Ad Soyad" name="name" required autoComplete="name" />
      <Field label="E-posta" name="email" type="email" required autoComplete="email" />
      <Field label="Telefon (opsiyonel)" name="phone" type="tel" autoComplete="tel" />
      <Field label="Şifre" name="password" type="password" required autoComplete="new-password" />
      <SubmitButton>Üye Ol</SubmitButton>
    </form>
  );
}

function DealerForm() {
  const [state, action] = useActionState<AuthState, FormData>(registerDealerAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />

      <p className="rounded-lg bg-navy/5 px-3 py-2 text-xs text-muted">
        Bayi hesabınız incelendikten sonra onaylanır; onaylanınca bayi fiyatlarını görürsünüz.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Firma Adı" name="companyName" required />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Firma Türü</span>
          <select
            name="companyType"
            defaultValue="SAHIS"
            className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-orange"
          >
            <option value="SAHIS">Şahıs Şirketi</option>
            <option value="LIMITED">Limited Şirket</option>
            <option value="ANONIM">Anonim Şirket</option>
            <option value="DIGER">Diğer</option>
          </select>
        </label>
        <Field label="Vergi Dairesi" name="taxOffice" />
        <Field label="Vergi / TC No" name="taxNumber" required />
        <Field label="İl" name="city" />
        <Field label="İlçe" name="district" />
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Adres</span>
        <textarea
          name="address"
          rows={2}
          className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-orange"
        />
      </label>

      <div className="border-t border-line pt-4">
        <p className="mb-3 text-sm font-semibold text-ink">Hesap Bilgileri</p>
        <div className="flex flex-col gap-4">
          <Field label="Yetkili Ad Soyad" name="name" required autoComplete="name" />
          <Field label="E-posta" name="email" type="email" required autoComplete="email" />
          <Field label="Telefon" name="phone" type="tel" required autoComplete="tel" />
          <Field label="Şifre" name="password" type="password" required autoComplete="new-password" />
        </div>
      </div>

      <SubmitButton>Bayi Kaydı Oluştur</SubmitButton>
    </form>
  );
}
