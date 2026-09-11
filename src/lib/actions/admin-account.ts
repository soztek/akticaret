"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff, verifyPassword, hashPassword } from "@/lib/auth";

export type AccountState = { ok?: boolean; error?: string } | undefined;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function changeEmailAction(_prev: AccountState, fd: FormData): Promise<AccountState> {
  const user = await requireStaff().catch(() => null);
  if (!user) return { error: "Yetkiniz yok." };

  const currentPassword = String(fd.get("currentPassword") ?? "");
  const newEmail = String(fd.get("newEmail") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(newEmail)) return { error: "Geçerli bir e-posta girin." };

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Kullanıcı bulunamadı." };

  const ok = await verifyPassword(currentPassword, dbUser.passwordHash);
  if (!ok) return { error: "Mevcut şifre hatalı." };

  if (newEmail !== dbUser.email) {
    const dup = await db.user.findUnique({ where: { email: newEmail } });
    if (dup) return { error: "Bu e-posta zaten başka bir hesapta kayıtlı." };
  }

  await db.user.update({ where: { id: user.id }, data: { email: newEmail } });
  await db.auditLog.create({
    data: {
      userId: user.id,
      actorName: user.name,
      action: "account.email",
      entityType: "User",
      entityId: user.id,
      newValue: { email: newEmail },
    },
  });

  revalidatePath("/admin/hesap");
  return { ok: true };
}

export async function changePasswordAction(_prev: AccountState, fd: FormData): Promise<AccountState> {
  const user = await requireStaff().catch(() => null);
  if (!user) return { error: "Yetkiniz yok." };

  const currentPassword = String(fd.get("currentPassword") ?? "");
  const newPassword = String(fd.get("newPassword") ?? "");
  const confirmPassword = String(fd.get("confirmPassword") ?? "");

  if (newPassword.length < 8) return { error: "Yeni şifre en az 8 karakter olmalı." };
  if (newPassword !== confirmPassword) return { error: "Yeni şifreler eşleşmiyor." };

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Kullanıcı bulunamadı." };

  const ok = await verifyPassword(currentPassword, dbUser.passwordHash);
  if (!ok) return { error: "Mevcut şifre hatalı." };

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await db.auditLog.create({
    data: {
      userId: user.id,
      actorName: user.name,
      action: "account.password",
      entityType: "User",
      entityId: user.id,
    },
  });

  return { ok: true };
}
