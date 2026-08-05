"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/form";

export default function LoginPage() {
  const [state, action] = useActionState<AuthState, FormData>(loginAction, undefined);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Giriş Yap</h1>
        <p className="mt-1 text-sm text-muted">Hesabınıza erişin.</p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <FormError message={state?.error} />
        <Field label="E-posta" name="email" type="email" required autoComplete="email" />
        <Field
          label="Şifre"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <SubmitButton>Giriş Yap</SubmitButton>
      </form>
      <p className="text-center text-sm text-muted">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="font-semibold text-orange hover:underline">
          Üye Ol
        </Link>
      </p>
    </div>
  );
}
