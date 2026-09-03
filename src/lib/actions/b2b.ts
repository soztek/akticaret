"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { CompanyType } from "@prisma/client";

const schema = z.object({
  companyName: z.string().min(2, "Firma adı gerekli"),
  contactName: z.string().min(2, "Yetkili adı gerekli"),
  phone: z.string().min(10, "Geçerli telefon girin"),
  email: z.string().email("Geçerli e-posta girin"),
  taxOffice: z.string().optional().or(z.literal("")),
  taxNumber: z.string().optional().or(z.literal("")),
  companyType: z.enum(["SAHIS", "LIMITED", "ANONIM", "DIGER"]),
  city: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export type B2BState = { error?: string; ok?: boolean } | undefined;

export async function applyB2BAction(_prev: B2BState, formData: FormData): Promise<B2BState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Başvuru için önce giriş yapmalısınız." };

  const parsed = schema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    taxOffice: formData.get("taxOffice"),
    taxNumber: formData.get("taxNumber"),
    companyType: formData.get("companyType"),
    city: formData.get("city"),
    district: formData.get("district"),
    address: formData.get("address"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi" };
  const d = parsed.data;

  const existing = await db.b2BCustomer.findUnique({ where: { userId: user.id } });
  if (existing && existing.status === "APPROVED") {
    return { error: "Zaten onaylı bir bayi hesabınız var." };
  }

  const data = {
    companyName: d.companyName,
    contactName: d.contactName,
    phone: d.phone,
    email: d.email,
    taxOffice: d.taxOffice || null,
    taxNumber: d.taxNumber || null,
    companyType: d.companyType as CompanyType,
    city: d.city || null,
    district: d.district || null,
    address: d.address || null,
    status: "PENDING" as const,
  };

  await db.b2BCustomer.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return { ok: true };
}
