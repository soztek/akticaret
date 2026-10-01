"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type DealerPaymentTerm } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";

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

  const b2b = await db.b2BCustomer.findUnique({ where: { id: b2bId } });
  if (!b2b) return { error: "Başvuru bulunamadı." };

  const pct = Number(input.discountPercent);
  if (!Number.isFinite(pct) || pct < 0 || pct > 90) {
    return { error: "İskonto %0–90 arası olmalı." };
  }
  const term: DealerPaymentTerm = input.paymentTerm === "VADELI" ? "VADELI" : "PESIN";

  await db.$transaction([
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
    db.user.update({ where: { id: b2b.userId }, data: { role: "B2B_CUSTOMER" } }),
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
  ]);
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
    db.user.update({ where: { id: b2b.userId }, data: { role: "B2C_CUSTOMER" } }),
  ]);
  revalidatePath("/admin/bayiler");
}

export async function suspendDealer(b2bId: string) {
  const admin = await requirePermission(PERMISSIONS.DEALERS_WRITE).catch(() => null);
  if (!admin) return;
  const b2b = await db.b2BCustomer.findUnique({ where: { id: b2bId } });
  if (!b2b) return;
  await db.$transaction([
    db.b2BCustomer.update({ where: { id: b2bId }, data: { status: "SUSPENDED" } }),
    db.user.update({ where: { id: b2b.userId }, data: { role: "B2C_CUSTOMER" } }),
  ]);
  revalidatePath("/admin/bayiler");
}
