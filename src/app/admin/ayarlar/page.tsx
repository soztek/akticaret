import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requirePermission(PERMISSIONS.SETTINGS_WRITE).catch(() => null);
  if (!user) redirect("/admin");

  const settings = await getSettings();

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Ayarlar</h1>
        <p className="text-sm text-muted">
          Firma bilgileri, iletişim, sosyal medya, kargo ve havale/EFT banka bilgileri. Değişiklikler
          site geneline (footer, WhatsApp, iletişim) yansır.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
