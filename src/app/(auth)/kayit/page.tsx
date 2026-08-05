"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthState } from "@/lib/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/form";

export default function RegisterPage() {
  const [state, action] = useActionState<AuthState, FormData>(registerAction, undefined);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Üye Ol</h1>
        <p className="mt-1 text-sm text-muted">Yeni bir müşteri hesabı oluşturun.</p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <FormError message={state?.error} />
        <Field label="Ad Soyad" name="name" required autoComplete="name" />
        <Field label="E-posta" name="email" type="email" required autoComplete="email" />
        <Field label="Telefon (opsiyonel)" name="phone" type="tel" autoComplete="tel" />
        <Field
          label="Şifre"
          name="password"
          type="password"
          required
          autoComplete="new-password"
        />
        <SubmitButton>Üye Ol</SubmitButton>
      </form>
      <p className="text-center text-sm text-muted">
        Zaten üye misiniz?{" "}
        <Link href="/giris" className="font-semibold text-orange hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  );
}
