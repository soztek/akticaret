"use client";

import { useActionState } from "react";
import { applyB2BAction, type B2BState } from "@/lib/actions/b2b";
import { Field, FormError, SubmitButton } from "@/components/form";

export function B2BApplicationForm({
  defaults,
}: {
  defaults: { companyName: string; contactName: string; phone: string; email: string };
}) {
  const [state, action] = useActionState<B2BState, FormData>(applyB2BAction, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-6 text-center">
        <p className="text-lg font-bold text-success">Başvurunuz alındı! ✓</p>
        <p className="mt-1 text-sm text-muted">
          Ekibimiz başvurunuzu inceleyip en kısa sürede sizinle iletişime geçecek.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 rounded-xl border border-line bg-paper p-6 sm:grid-cols-2">
      <FormError message={state?.error} />
      <Field label="Firma Adı" name="companyName" required defaultValue={defaults.companyName} />
      <Field label="Yetkili Ad Soyad" name="contactName" required defaultValue={defaults.contactName} />
      <Field label="Telefon" name="phone" type="tel" required defaultValue={defaults.phone} />
      <Field label="E-posta" name="email" type="email" required defaultValue={defaults.email} />
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
      <Field label="Vergi / TC No" name="taxNumber" />
      <Field label="İl" name="city" />
      <Field label="İlçe" name="district" />
      <div className="sm:col-span-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Adres</span>
          <textarea
            name="address"
            rows={3}
            className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-orange"
          />
        </label>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>Başvuruyu Gönder</SubmitButton>
      </div>
    </form>
  );
}
