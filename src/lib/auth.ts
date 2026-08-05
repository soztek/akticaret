import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "@/lib/db";
import { can, isStaffRole, type PermissionKey } from "@/lib/rbac";
import type { User } from "@prisma/client";

const COOKIE_NAME = "ak_session";
const SESSION_DAYS = 30;

// ---------- Parola ----------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------- Oturum ----------

export async function createSession(
  userId: string,
  meta?: { userAgent?: string; ip?: string },
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { token, userId, expiresAt, userAgent: meta?.userAgent, ip: meta?.ip },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
    store.delete(COOKIE_NAME);
  }
}

export type SessionUser = User & { permissionKeys: string[] };

/** Geçerli kullanıcı (izin anahtarlarıyla). İstek başına önbelleklenir. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: { include: { permissions: { include: { permission: true } } } },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  const { permissions, ...user } = session.user;
  return {
    ...user,
    permissionKeys: permissions.map((p) => p.permission.key),
  };
});

// ---------- Guard'lar ----------

/** Girişli kullanıcıyı döndürür; yoksa hata. Sayfa/aksiyonlarda kullan. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** Personel (admin panel) rolü gerektirir. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isStaffRole(user.role)) throw new Error("FORBIDDEN");
  return user;
}

/** Belirli bir yetki gerektirir. */
export async function requirePermission(
  permission: PermissionKey,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission, user.permissionKeys)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** Kullanıcı yetkiye sahip mi? (UI'da koşullu gösterim için) */
export function userCan(user: SessionUser, permission: PermissionKey): boolean {
  return can(user.role, permission, user.permissionKeys);
}
