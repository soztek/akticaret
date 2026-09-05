"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const admin = await requirePermission(PERMISSIONS.ORDERS_WRITE).catch(() => null);
  if (!admin) return;
  await db.order.update({ where: { id: orderId }, data: { status } });
  await db.auditLog.create({
    data: {
      userId: admin.id,
      actorName: admin.name,
      action: "order.status",
      entityType: "Order",
      entityId: orderId,
      newValue: { status },
    },
  });
  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
}

export async function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
  const admin = await requirePermission(PERMISSIONS.ORDERS_WRITE).catch(() => null);
  if (!admin) return;
  await db.order.update({ where: { id: orderId }, data: { paymentStatus } });
  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
}
