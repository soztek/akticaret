"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";

/** Bayi başvurusunu onayla: B2BCustomer APPROVED + kullanıcı rolü B2B_CUSTOMER + grup ata. */
export async function approveDealer(b2bId: string, customerGroupId: string | null) {
  const admin = await requirePermission(PERMISSIONS.DEALERS_WRITE).catch(() => null);
  if (!admin) return;

  const b2b = await db.b2BCustomer.findUnique({ where: { id: b2bId } });
  if (!b2b) return;

  await db.$transaction([
    db.b2BCustomer.update({
      where: { id: b2bId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: admin.id,
        customerGroupId: customerGroupId || null,
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
      },
    }),
  ]);
  revalidatePath("/admin/bayiler");
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
