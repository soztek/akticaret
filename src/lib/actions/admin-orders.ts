"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";

export async function deleteOrder(orderId: string): Promise<{ ok?: boolean; error?: string }> {
  const admin = await requirePermission(PERMISSIONS.ORDERS_WRITE).catch(() => null);
  if (!admin) return { error: "Yetkiniz yok." };

  const order = await db.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } });
  if (!order) return { error: "Sipariş bulunamadı." };

  // OrderItem / Payment / Shipment cascade ile silinir.
  await db.order.delete({ where: { id: orderId } });
  await db.auditLog.create({
    data: {
      userId: admin.id,
      actorName: admin.name,
      action: "order.delete",
      entityType: "Order",
      entityId: orderId,
      newValue: { orderNumber: order.orderNumber },
    },
  });
  revalidatePath("/admin/siparisler");
  revalidatePath("/admin");
  return { ok: true };
}

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
