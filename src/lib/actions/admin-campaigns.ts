"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { uniqueSlug } from "@/lib/slug";

export type CampaignInput = {
  id?: string;
  title: string;
  imageUrl?: string | null;
  description?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  badge?: string | null;
  productId?: string | null;
  isPublished: boolean;
  startsAt?: string | null; // "YYYY-MM-DD"
  endsAt?: string | null; // "YYYY-MM-DD"
};

export type CampaignResult = { ok?: boolean; error?: string } | undefined;

const dec = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? new Prisma.Decimal(n) : null;

async function guard() {
  return requirePermission(PERMISSIONS.CAMPAIGNS_WRITE).catch(() => null);
}

export async function saveCampaign(input: CampaignInput): Promise<CampaignResult> {
  if (!(await guard())) return { error: "Yetkiniz yok." };
  const title = input.title.trim();
  if (!title) return { error: "Kampanya başlığı gerekli." };

  const data = {
    title,
    imageUrl: input.imageUrl || null,
    description: input.description || null,
    price: dec(input.price),
    compareAtPrice: dec(input.compareAtPrice),
    badge: input.badge || null,
    productId: input.productId || null,
    isPublished: input.isPublished,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(`${input.endsAt}T23:59:59`) : null,
  };

  if (input.id) {
    await db.promoCampaign.update({ where: { id: input.id }, data });
    revalidatePath("/admin/kampanyalar");
    revalidatePath("/kampanyalar");
    return { ok: true };
  }

  const created = await db.promoCampaign.create({
    data: {
      ...data,
      slug: await uniqueSlug(title, async (s) =>
        Boolean(await db.promoCampaign.findUnique({ where: { slug: s } })),
      ),
    },
  });
  revalidatePath("/admin/kampanyalar");
  revalidatePath("/kampanyalar");
  redirect(`/admin/kampanyalar/${created.id}`);
}

export async function togglePublish(id: string, next: boolean) {
  if (!(await guard())) return;
  await db.promoCampaign.update({ where: { id }, data: { isPublished: next } });
  revalidatePath("/admin/kampanyalar");
  revalidatePath("/kampanyalar");
}

export async function deleteCampaign(id: string): Promise<CampaignResult> {
  if (!(await guard())) return { error: "Yetkiniz yok." };
  await db.promoCampaign.delete({ where: { id } });
  revalidatePath("/admin/kampanyalar");
  revalidatePath("/kampanyalar");
  return { ok: true };
}
