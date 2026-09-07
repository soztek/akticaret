"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";
import { loginSchema, registerSchema, registerDealerSchema } from "@/lib/validators/auth";
import type { CompanyType } from "@prisma/client";

export type AuthState = { error?: string } | undefined;

async function requestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent") ?? undefined,
    ip:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      undefined,
  };
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş" };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !user.isActive) {
    return { error: "E-posta veya şifre hatalı" };
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "E-posta veya şifre hatalı" };

  await createSession(user.id, await requestMeta());

  redirect(isStaffRole(user.role) ? "/admin" : "/hesabim");
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi" };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Bu e-posta zaten kayıtlı" };

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: "B2C_CUSTOMER",
    },
  });

  await createSession(user.id, await requestMeta());
  redirect("/hesabim");
}

export async function registerDealerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerDealerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
    companyType: formData.get("companyType"),
    taxOffice: formData.get("taxOffice"),
    taxNumber: formData.get("taxNumber"),
    city: formData.get("city"),
    district: formData.get("district"),
    address: formData.get("address"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi" };
  }
  const d = parsed.data;

  const email = d.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Bu e-posta zaten kayıtlı" };

  // Hesap B2C rolüyle açılır; bayi onaylanınca admin panelden yükseltilir.
  const user = await db.user.create({
    data: {
      name: d.name,
      email,
      phone: d.phone || null,
      passwordHash: await hashPassword(d.password),
      role: "B2C_CUSTOMER",
      b2bCustomer: {
        create: {
          companyName: d.companyName,
          contactName: d.name,
          phone: d.phone || "",
          email,
          taxOffice: d.taxOffice || null,
          taxNumber: d.taxNumber || null,
          companyType: d.companyType as CompanyType,
          city: d.city || null,
          district: d.district || null,
          address: d.address || null,
          status: "PENDING",
        },
      },
    },
  });

  await createSession(user.id, await requestMeta());
  redirect("/hesabim?bayi=beklemede");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
