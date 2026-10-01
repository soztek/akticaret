import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { type PriceView, GUEST_VIEW } from "@/lib/pricing";

/** Geçerli kullanıcının fiyat görünümü (bayi mi + grup indirimi). İstek başına cache'li. */
export const getPriceView = cache(async (): Promise<PriceView> => {
  const user = await getCurrentUser();
  if (!user || user.role !== "B2B_CUSTOMER") return GUEST_VIEW;
  const b2b = await db.b2BCustomer.findUnique({
    where: { userId: user.id },
    select: { status: true, discountPercent: true, paymentTerm: true },
  });
  if (!b2b || b2b.status !== "APPROVED") return GUEST_VIEW;
  return {
    isDealer: true,
    discount: Number(b2b.discountPercent ?? 0),
    canUseAccount: b2b.paymentTerm === "VADELI",
  };
});
