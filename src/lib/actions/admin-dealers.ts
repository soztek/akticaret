"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type DealerPaymentTerm } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS, isStaffRole } from "@/lib/rbac";

export type ApproveDealerInput = {
  customerGroupId: string | null;
  discountPercent: number; // bayiye özel iskonto (%)
  paymentTerm: DealerPaymentTerm; // PESIN | VADELI
};

/**
 * Bayi başvurusunu onayla: B2BCustomer APPROVED + kullanıcı rolü B2B_CUSTOMER
 * + grup, bayiye özel iskonto ve ödeme şekli (peşin/vadeli) atanır.
 */
export async function approveDealer(b2bId: string, input: ApproveDealerInput) {
  const admin = await requirePermission(PERMISSIONS.DEALERS_WRITE).catch(() => null);
  if (!admin) return { error: "Yetkiniz yok." };

  const b2b = await db.b2BCustomer.findUnique({
    where: { id: b2bId },
    include: { user: { select: { id: true, role: true } } },
  });
  if (!b2b) return { error: "Başvuru bulunamadı." };

  const pct = Number(input.discountPercent);
  if (!Number.isFinite(pct) || pct < 0 || pct > 90) {
    return { error: "İskonto %0–90 arası olmalı." };
  }
  const term: DealerPaymentTerm = input.paymentTerm === "VADELI" ? "VADELI" : "PESIN";

  const ops: Prisma.PrismaPromise<unknown>[] = [
    db.b2BCustomer.update({
      where: { id: b2bId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: admin.id,
        customerGroupId: input.customerGroupId || null,
        discountPercent: new Prisma.Decimal(pct),
        paymentTerm: term,
      },
    }),
    db.auditLog.create({
      data: {
        userId: admin.id,
        actorName: admin.name,
        action: "dealer.approve",
        entityType: "B2BCustomer",
        entityId: b2bId,
        newValue: { group: input.customerGroupId, discountPercent: pct, paymentTerm: term } as Prisma.InputJsonValue,
      },
    }),
  ];
  // Personel (admin vb.) rolünü ASLA değiştirme; yalnızca müşteri rolünü yükselt.
  if (!isStaffRole(b2b.user.role)) {
    ops.push(db.user.update({ where: { id: b2b.user.id }, data: { role: "B2B_CUSTOMER" } }));
  }
  await db.$transaction(ops);
  revalidatePath("/admin/bayiler");
  return { ok: true };
}

export async function rejectDealer(b2bId: string) {
  const admin = await requirePermission(PERMISSIONS.DEALERS_WRITE).catch(() => null);
  if (!admin) return;
  const b2b = await db.b2BCustomer.findUnique({ where: { id: b2bId } });
  if (!b2b) return;
  await db.$transaction([
    db.b2BCustomer.update({ where: { id: b2bId }, data: { status: "REJECTED" } }),
    // Yalnızca bayi rolündeyse düşür; personel (admin) rolüne dokunma.
    db.user.updateMany({ where: { id: b2b.userId, role: "B2B_CUSTOMER" }, data: { role: "B2C_CUSTOMER" } }),
  ]);
  revalidatePath("/admin/bayiler");
}

/** Bayi başvurusunu/kaydını tamamen sil. Kullanıcı hesabı KALIR; yalnızca bayi
 *  kaydı silinir. Kullanıcı bayi rolündeyse B2C'ye düşürülür (personel rolüne dokunulmaz). */
export async function deleteDealer(b2bId: string): Promise<{ ok?: boolean; error?: string }> {
  const admin = await requirePermission(PERMISSIONS.DEALERS_WRITE).catch(() => null);
  if (!admin) return { error: "Yetkiniz yok." };

  const b2b = await db.b2BCustomer.findUnique({
    where: { id: b2bId },
    include: { user: { select: { id: true, role: true } } },
  });
  if (!b2b) return { error: "Kayıt bulunamadı." };

  await db.$transaction(async (tx) => {
    await tx.b2BCustomer.delete({ where: { id: b2bId } });
    // Sadece bayi rolündeyse düşür; admin/personel rollerine dokunma.
    if (b2b.user.role === "B2B_CUSTOMER") {
      await tx.user.update({ where: { id: b2b.user.id }, data: { role: "B2C_CUSTOMER" } });
    }
    await tx.auditLog.create({
      data: {
        userId: admin.id,
        actorName: admin.name,
        action: "dealer.delete",
        entityType: "B2BCustomer",
        entityId: b2bId,
        newValue: { companyName: b2b.companyName } as Prisma.InputJsonValue,
      },
    });
  });
  revalidatePath("/admin/bayiler");
  return { ok: true };
}

export async function suspendDealer(b2bId: string) {
  const admin = await requirePermission(PERMISSIONS.DEALERS_WRITE).catch(() => null);
  if (!admin) return;
  const b2b = await db.b2BCustomer.findUnique({ where: { id: b2bId } });
  if (!b2b) return;
  await db.$transaction([
    db.b2BCustomer.update({ where: { id: b2bId }, data: { status: "SUSPENDED" } }),
    db.user.updateMany({ where: { id: b2b.userId, role: "B2B_CUSTOMER" }, data: { role: "B2C_CUSTOMER" } }),
  ]);
  revalidatePath("/admin/bayiler");
}
