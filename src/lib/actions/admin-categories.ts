"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { uniqueSlug } from "@/lib/slug";

export type CatActionResult = { ok?: boolean; error?: string };

async function guard() {
  return requirePermission(PERMISSIONS.CATEGORIES_WRITE).catch(() => null);
}

const takenSlug = async (s: string) =>
  Boolean(await db.category.findUnique({ where: { slug: s } }));

export async function createCategory(input: {
  name: string;
  parentId?: string | null;
  icon?: string | null;
}): Promise<CatActionResult> {
  if (!(await guard())) return { error: "Yetkiniz yok." };
  const name = input.name.trim();
  if (!name) return { error: "Kategori adı gerekli." };

  const parentId = input.parentId || null;
  const maxOrder = await db.category.aggregate({
    where: { parentId },
    _max: { sortOrder: true },
  });
  await db.category.create({
    data: {
      name,
      slug: await uniqueSlug(name, takenSlug),
      parentId,
      icon: input.icon || null,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/admin/kategoriler");
  return { ok: true };
}

export async function updateCategory(input: {
  id: string;
  name: string;
  parentId?: string | null;
  icon?: string | null;
  isActive?: boolean;
}): Promise<CatActionResult> {
  if (!(await guard())) return { error: "Yetkiniz yok." };
  const name = input.name.trim();
  if (!name) return { error: "Kategori adı gerekli." };
  // Kendini veya alt-soyunu parent yapma engeli
  if (input.parentId) {
    if (input.parentId === input.id) return { error: "Kategori kendisinin alt kategorisi olamaz." };
    const descendants = await getDescendants(input.id);
    if (descendants.has(input.parentId)) return { error: "Kategori kendi alt kategorisine taşınamaz." };
  }
  await db.category.update({
    where: { id: input.id },
    data: {
      name,
      parentId: input.parentId || null,
      icon: input.icon || null,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  revalidatePath("/admin/kategoriler");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<CatActionResult> {
  if (!(await guard())) return { error: "Yetkiniz yok." };
  const childCount = await db.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    return { error: `Bu kategorinin ${childCount} alt kategorisi var. Önce onları silin veya taşıyın.` };
  }
  // Ürünler kategorisiz kalır (categoryId null olur)
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/kategoriler");
  return { ok: true };
}

/** Kategoriyi kopyala (ürünler kopyalanmaz; boş kategori). */
export async function duplicateCategory(id: string): Promise<CatActionResult> {
  if (!(await guard())) return { error: "Yetkiniz yok." };
  const src = await db.category.findUnique({ where: { id } });
  if (!src) return { error: "Kategori bulunamadı." };
  const name = `${src.name} (kopya)`;
  await db.category.create({
    data: {
      name,
      slug: await uniqueSlug(name, takenSlug),
      parentId: src.parentId,
      icon: src.icon,
      imageUrl: src.imageUrl,
      description: src.description,
      sortOrder: src.sortOrder + 1,
    },
  });
  revalidatePath("/admin/kategoriler");
  return { ok: true };
}

/** Bir kategorinin tüm alt-soy id'leri (döngü/parent güvenliği için). */
async function getDescendants(rootId: string): Promise<Set<string>> {
  const all = await db.category.findMany({ select: { id: true, parentId: true } });
  const childrenOf = new Map<string, string[]>();
  for (const c of all) {
    if (c.parentId) {
      if (!childrenOf.has(c.parentId)) childrenOf.set(c.parentId, []);
      childrenOf.get(c.parentId)!.push(c.id);
    }
  }
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const ch of childrenOf.get(cur) ?? []) {
      if (!out.has(ch)) {
        out.add(ch);
        stack.push(ch);
      }
    }
  }
  return out;
}
