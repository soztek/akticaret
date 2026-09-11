"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail, KeyRound, CheckCircle2 } from "lucide-react";
import { changeEmailAction, changePasswordAction, type AccountState } from "@/lib/actions/admin-account";

function Input({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none transition focus:border-orange"
      />
    </label>
  );
}

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
    >
      {pending ? "Kaydediliyor…" : children}
    </button>
  );
}

function Result({ state, okText }: { state: AccountState; okText: string }) {
  if (state?.error) {
    return <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{state.error}</p>;
  }
  if (state?.ok) {
    return (
      <p className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
        <CheckCircle2 className="h-4 w-4" /> {okText}
      </p>
    );
  }
  return null;
}

export function AccountForms({ currentEmail, currentName }: { currentEmail: string; currentName: string }) {
  const [emailState, emailAction] = useActionState<AccountState, FormData>(changeEmailAction, undefined);
  const [pwState, pwAction] = useActionState<AccountState, FormData>(changePasswordAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      {/* E-posta değiştir */}
      <form action={emailAction} className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-5">
        <h2 className="flex items-center gap-2 font-bold text-ink">
          <Mail className="h-5 w-5 text-orange" /> Giriş E-postası
        </h2>
        <Result state={emailState} okText="E-posta güncellendi. Bir sonraki girişte yeni e-postayı kullanın." />
        <Input label="Yeni E-posta" name="newEmail" type="email" defaultValue={currentEmail} autoComplete="email" />
        <Input label="Mevcut Şifre (doğrulama)" name="currentPassword" type="password" autoComplete="current-password" placeholder="Onay için mevcut şifreniz" />
        <Submit>E-postayı Güncelle</Submit>
      </form>

      {/* Şifre değiştir */}
      <form action={pwAction} className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-5">
        <h2 className="flex items-center gap-2 font-bold text-ink">
          <KeyRound className="h-5 w-5 text-orange" /> Şifre Değiştir
        </h2>
        <Result state={pwState} okText="Şifre güncellendi." />
        <Input label="Mevcut Şifre" name="currentPassword" type="password" autoComplete="current-password" />
        <Input label="Yeni Şifre (en az 8 karakter)" name="newPassword" type="password" autoComplete="new-password" />
        <Input label="Yeni Şifre (tekrar)" name="confirmPassword" type="password" autoComplete="new-password" />
        <Submit>Şifreyi Güncelle</Submit>
      </form>

      <p className="text-xs text-muted">Oturum sahibi: {currentName}</p>
    </div>
  );
}
