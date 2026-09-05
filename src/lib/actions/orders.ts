"use server";

import { randomBytes } from "crypto";
import { Prisma, type PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPriceView } from "@/lib/pricing-server";
import { resolvePrice } from "@/lib/pricing";
import { computeTotals } from "@/lib/order-calc";

export type CreateOrderInput = {
  items: { productId: string; qty: number }[];
  billingName: string;
  billingPhone: string;
  billingCity: string;
  billingDistrict: string;
  billingAddress: string;
  paymentMethod: "BANK_TRANSFER" | "CARD" | "ACCOUNT";
  note?: string;
};

export type CreateOrderResult = { ok: true; orderNumber: string } | { ok: false; error: string };

function genOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = randomBytes(2).toString("hex").toUpperCase();
  return `AK-${ts}-${rnd}`;
}

export async function createOrderAction(input: CreateOrderInput): Promise<CreateOrderResult> {
  const items = (input.items ?? []).filter((i) => i.productId && i.qty > 0);
  if (items.length === 0) return { ok: false, error: "Sepetiniz boş." };

  if (!input.billingName?.trim() || !input.billingPhone?.trim() || !input.billingAddress?.trim() || !input.billingCity?.trim()) {
    return { ok: false, error: "Lütfen ad, telefon, il ve adres alanlarını doldurun." };
  }

  const [user, view] = await Promise.all([getCurrentUser(), getPriceView()]);

  if (input.paymentMethod === "ACCOUNT" && !view.isDealer) {
    return { ok: false, error: "Cari hesap ile ödeme yalnızca onaylı bayilere açıktır." };
  }

  // Ürünleri getir, fiyatı SUNUCUDA yeniden hesapla
  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    select: { id: true, name: true, sku: true, stock: true, vatRate: true, b2cPrice: true, b2bPrice: true, listPrice: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const orderItems: {
    productId: string;
    productName: string;
    sku: string | null;
    unitPrice: number;
    quantity: number;
    vatRate: number;
    lineTotal: number;
  }[] = [];

  for (const i of items) {
    const p = byId.get(i.productId);
    if (!p) return { ok: false, error: "Bazı ürünler artık mevcut değil. Sepetinizi güncelleyin." };
    if (p.stock <= 0) return { ok: false, error: `"${p.name}" stokta yok.` };
    const qty = Math.min(i.qty, p.stock); // stoktan fazlasını sınırla
    const { price } = resolvePrice(
      { b2cPrice: Number(p.b2cPrice), b2bPrice: p.b2bPrice != null ? Number(p.b2bPrice) : null, listPrice: Number(p.listPrice) },
      view,
    );
    orderItems.push({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      unitPrice: price,
      quantity: qty,
      vatRate: p.vatRate,
      lineTotal: Math.round(price * qty * 100) / 100,
    });
  }

  const totals = computeTotals(orderItems.map((o) => ({ price: o.unitPrice, qty: o.quantity, vatRate: o.vatRate })));

  const method = input.paymentMethod as PaymentMethod;
  const status =
    input.paymentMethod === "ACCOUNT" ? "PREPARING" : "AWAITING_PAYMENT";

  const orderNumber = genOrderNumber();

  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          customerType: view.isDealer ? "B2B" : "B2C",
          status,
          subtotal: new Prisma.Decimal(totals.subtotal),
          discountTotal: new Prisma.Decimal(0),
          vatTotal: new Prisma.Decimal(totals.vatTotal),
          shippingTotal: new Prisma.Decimal(totals.shipping),
          grandTotal: new Prisma.Decimal(totals.grandTotal),
          note: input.note?.trim() || null,
          billingName: input.billingName.trim(),
          billingPhone: input.billingPhone.trim(),
          billingCity: input.billingCity.trim(),
          billingDistrict: input.billingDistrict?.trim() || null,
          billingAddress: input.billingAddress.trim(),
          shippingName: input.billingName.trim(),
          shippingPhone: input.billingPhone.trim(),
          shippingCity: input.billingCity.trim(),
          shippingDistrict: input.billingDistrict?.trim() || null,
          shippingAddress: input.billingAddress.trim(),
          paymentMethod: method,
          paymentStatus: "PENDING",
          items: {
            create: orderItems.map((o) => ({
              productId: o.productId,
              productName: o.productName,
              sku: o.sku,
              unitPrice: new Prisma.Decimal(o.unitPrice),
              quantity: o.quantity,
              vatRate: o.vatRate,
              lineTotal: new Prisma.Decimal(o.lineTotal),
            })),
          },
          payments: {
            create: {
              provider: process.env.PAYMENT_PROVIDER ?? "none",
              method,
              amount: new Prisma.Decimal(totals.grandTotal),
              status: "PENDING",
            },
          },
        },
      });

      // Stok düş + hareket kaydı
      for (const o of orderItems) {
        await tx.product.update({
          where: { id: o.productId },
          data: { stock: { decrement: o.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: o.productId,
            type: "ORDER",
            quantity: -o.quantity,
            source: "ORDER",
            refType: "ORDER",
            refId: order.id,
          },
        });
      }
    });
  } catch {
    return { ok: false, error: "Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin." };
  }

  return { ok: true, orderNumber };
}
