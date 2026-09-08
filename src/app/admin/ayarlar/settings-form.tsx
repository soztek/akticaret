"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Building2, Share2, Truck, Landmark, Info } from "lucide-react";
import { saveSettings, type SettingsState } from "@/lib/actions/admin-settings";
import type { Settings } from "@/lib/settings";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none transition focus:border-orange"
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Area({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue?: string | null; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        rows={2}
        className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none transition focus:border-orange"
      />
    </label>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
        <Icon className="h-5 w-5 text-orange" /> {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function SaveBar({ ok }: { ok?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-paper/95 py-3 backdrop-blur">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
      {ok && !pending && (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> Kaydedildi
        </span>
      )}
    </div>
  );
}

export function SettingsForm({ settings: s }: { settings: Settings }) {
  const [state, action] = useActionState<SettingsState, FormData>(saveSettings, undefined);
  const d = s.data;

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{state.error}</p>
      )}

      <Section title="Firma & İletişim" icon={Building2}>
        <Field label="Firma Adı" name="companyName" defaultValue={s.companyName} />
        <Field label="E-posta" name="email" type="email" defaultValue={s.email} placeholder="info@akticaret.com" />
        <Field label="Telefon" name="phone" defaultValue={s.phone} placeholder="0538 583 27 04" />
        <Field label="WhatsApp No" name="whatsapp" defaultValue={s.whatsapp} placeholder="905385832704" hint="Ülke kodu ile, sadece rakam (wa.me için)." />
        <div className="sm:col-span-2">
          <Area label="Adres" name="address" defaultValue={s.address} placeholder="Mahalle, cadde, no, ilçe/il" />
        </div>
      </Section>

      <Section title="Sosyal Medya" icon={Share2}>
        <Field label="Instagram" name="instagram" defaultValue={s.instagram} placeholder="https://instagram.com/..." />
        <Field label="Facebook" name="facebook" defaultValue={d.facebook} placeholder="https://facebook.com/..." />
        <Field label="X (Twitter)" name="x" defaultValue={d.x} placeholder="https://x.com/..." />
        <Field label="YouTube" name="youtube" defaultValue={d.youtube} placeholder="https://youtube.com/@..." />
      </Section>

      <Section title="Kargo" icon={Truck}>
        <Field
          label="Ücretsiz Kargo Limiti (₺, KDV hariç)"
          name="freeShipThreshold"
          defaultValue={s.freeShipThreshold != null ? String(s.freeShipThreshold) : ""}
          placeholder="örn. 5000"
          hint="Bu tutarın üzeri sepetlerde kargo ücretsiz olur. Boş bırakılırsa varsayılan kullanılır."
        />
      </Section>

      <Section title="Havale / EFT Banka Bilgileri" icon={Landmark}>
        <Field label="Banka Adı" name="bankName" defaultValue={d.bankName} placeholder="örn. Ziraat Bankası" />
        <Field label="Şube" name="bankBranch" defaultValue={d.bankBranch} placeholder="örn. Soma / Manisa" />
        <Field label="Hesap Sahibi" name="accountHolder" defaultValue={d.accountHolder} placeholder="Ünvan" />
        <Field label="IBAN" name="iban" defaultValue={d.iban} placeholder="TR__ ____ ____ ____ ____ ____ __" />
      </Section>

      <Section title="Hakkında & Çalışma Saatleri" icon={Info}>
        <div className="sm:col-span-2">
          <Area label="Kısa Açıklama (footer)" name="aboutShort" defaultValue={d.aboutShort} placeholder="Yapı ve hırdavatta profesyonel çözümler…" />
        </div>
        <div className="sm:col-span-2">
          <Area label="Çalışma Saatleri" name="workingHours" defaultValue={d.workingHours} placeholder="Hafta içi 08:30–19:00, Cumartesi 09:00–17:00" />
        </div>
      </Section>

      <SaveBar ok={state?.ok} />
    </form>
  );
}
