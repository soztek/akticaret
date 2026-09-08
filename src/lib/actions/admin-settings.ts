"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import type { SettingsData } from "@/lib/settings";

export type SettingsState = { ok?: boolean; error?: string } | undefined;

const str = (fd: FormData, key: string) => {
  const v = String(fd.get(key) ?? "").trim();
  return v || null;
};

export async function saveSettings(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const user = await requirePermission(PERMISSIONS.SETTINGS_WRITE).catch(() => null);
  if (!user) return { error: "Yetkiniz yok." };

  const companyName = String(fd.get("companyName") ?? "").trim();
  if (!companyName) return { error: "Firma adı gerekli." };
  const phone = String(fd.get("phone") ?? "").trim();
  if (!phone) return { error: "Telefon gerekli." };
  const whatsapp = String(fd.get("whatsapp") ?? "").replace(/\D/g, "");
  if (!whatsapp) return { error: "WhatsApp numarası gerekli." };

  const thresholdRaw = String(fd.get("freeShipThreshold") ?? "").replace(/\./g, "").replace(",", ".").trim();
  const threshold = thresholdRaw ? Number(thresholdRaw) : null;
  if (thresholdRaw && (!Number.isFinite(threshold) || threshold! < 0)) {
    return { error: "Geçerli bir ücretsiz kargo limiti girin." };
  }

  const data: SettingsData = {
    aboutShort: str(fd, "aboutShort") ?? undefined,
    workingHours: str(fd, "workingHours") ?? undefined,
    facebook: str(fd, "facebook") ?? undefined,
    youtube: str(fd, "youtube") ?? undefined,
    x: str(fd, "x") ?? undefined,
    bankName: str(fd, "bankName") ?? undefined,
    bankBranch: str(fd, "bankBranch") ?? undefined,
    accountHolder: str(fd, "accountHolder") ?? undefined,
    iban: str(fd, "iban") ?? undefined,
  };

  const payload = {
    companyName,
    phone,
    whatsapp,
    email: str(fd, "email"),
    address: str(fd, "address"),
    instagram: str(fd, "instagram"),
    freeShipThreshold: threshold != null ? new Prisma.Decimal(threshold) : null,
    data: data as Prisma.InputJsonValue,
  };

  await db.siteSetting.upsert({
    where: { id: "main" },
    update: payload,
    create: { id: "main", ...payload },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      actorName: user.name,
      action: "settings.update",
      entityType: "SiteSetting",
      entityId: "main",
    },
  });

  // Ayarları kullanan tüm sayfaları tazele
  revalidatePath("/", "layout");
  return { ok: true };
}
