"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";

/**
 * Müşteri/bayi olarak kayıtlı bir kullanıcıyı sil.
 * - Yalnızca SUPER_ADMIN yapabilir.
 * - Personel (admin vb.) hesapları ve kişinin kendisi silinemez.
 * - Siparişi olan kullanıcı, kayıt bütünlüğü için silinmez.
 * - Bağlı bayi kaydı, sepet, favoriler, adresler vb. birlikte silinir (cascade).
 */
export async function deleteCustomer(userId: string): Promise<{ ok?: boolean; error?: string }> {
  const admin = await requireStaff().catch(() => null);
  if (!admin) return { error: "Yetkiniz yok." };
  if (admin.role !== "SUPER_ADMIN") return { error: "Bu işlem için Süper Admin yetkisi gerekir." };
  if (admin.id === userId) return { error: "Kendi hesabınızı silemezsiniz." };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, _count: { select: { orders: true } } },
  });
  if (!user) return { error: "Kullanıcı bulunamadı." };
  if (isStaffRole(user.role)) return { error: "Personel hesapları buradan silinemez." };
  if (user._count.orders > 0) {
    return { error: "Siparişi olan kullanıcı silinemez (kayıt bütünlüğü). Önce pasife alın." };
  }

  try {
    await db.user.delete({ where: { id: userId } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Silinemedi";
    return { error: `Silinemedi: ${msg.slice(0, 120)}` };
  }

  await db.auditLog.create({
    data: {
      userId: admin.id,
      actorName: admin.name,
      action: "user.delete",
      entityType: "User",
      entityId: userId,
    },
  }).catch(() => {});

  revalidatePath("/admin/musteriler");
  revalidatePath("/admin/bayiler");
  return { ok: true };
}

/** Kullanıcıyı pasife al / aktifleştir (silmek yerine güvenli alternatif). */
export async function toggleUserActive(userId: string, isActive: boolean): Promise<{ ok?: boolean; error?: string }> {
  const admin = await requireStaff().catch(() => null);
  if (!admin) return { error: "Yetkiniz yok." };
  if (admin.id === userId) return { error: "Kendi hesabınızı değiştiremezsiniz." };

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return { error: "Kullanıcı bulunamadı." };
  if (isStaffRole(user.role) && admin.role !== "SUPER_ADMIN") {
    return { error: "Personel hesabını yalnızca Süper Admin değiştirebilir." };
  }

  await db.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/musteriler");
  return { ok: true };
}
