import { cache } from "react";
import { db } from "@/lib/db";

/** SiteSetting.data içindeki serbest alanlar. */
export type SettingsData = {
  aboutShort?: string;
  workingHours?: string;
  facebook?: string;
  youtube?: string;
  x?: string;
  // Havale/EFT için banka bilgileri
  bankName?: string;
  bankBranch?: string;
  accountHolder?: string;
  iban?: string;
};

export type Settings = {
  companyName: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  address: string | null;
  instagram: string | null;
  freeShipThreshold: number | null;
  data: SettingsData;
};

const DEFAULTS: Settings = {
  companyName: "AK TİCARET YAPI MALZEMELERİ",
  phone: "0538 583 27 04",
  whatsapp: "905385832704",
  email: null,
  address: null,
  instagram: null,
  freeShipThreshold: null,
  data: {},
};

/** Tekil site ayarını getirir (request başına cache'li). Kayıt yoksa varsayılan döner. */
export const getSettings = cache(async (): Promise<Settings> => {
  const row = await db.siteSetting.findUnique({ where: { id: "main" } });
  if (!row) return DEFAULTS;
  return {
    companyName: row.companyName,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    instagram: row.instagram,
    freeShipThreshold: row.freeShipThreshold != null ? Number(row.freeShipThreshold) : null,
    data: (row.data as SettingsData | null) ?? {},
  };
});

/** wa.me linkleri için whatsapp numarasını rakamlara indirger. */
export function waNumber(v: string): string {
  return v.replace(/\D/g, "");
}

/** tel: linki için telefonu sadeleştirir (başında + varsa korur). */
export function telNumber(v: string): string {
  const digits = v.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return "+9" + digits; // 0538... -> +90538...
  return digits;
}
