import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { normalizeSearch } from "@/lib/search-normalize";

// ============================================================
// Katalog veri erişimi + serileştirme (Decimal -> number).
// Client bileşenlere Prisma nesnesi DEĞİL, düz nesne geçilir.
// ============================================================

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  unit: string;
  vatRate: number;
  brandName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  listPrice: number;
  b2cPrice: number;
  b2bPrice: number | null;
  stock: number;
  isFeatured: boolean;
  imageUrl: string | null;
};

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  unit: true,
  vatRate: true,
  listPrice: true,
  b2cPrice: true,
  b2bPrice: true,
  stock: true,
  isFeatured: true,
  brand: { select: { name: true } },
  category: { select: { name: true, slug: true } },
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { url: true },
  },
} satisfies Prisma.ProductSelect;

type ProductCardRow = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

function toCard(p: ProductCardRow): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    unit: p.unit,
    vatRate: p.vatRate,
    brandName: p.brand?.name ?? null,
    categoryName: p.category?.name ?? null,
    categorySlug: p.category?.slug ?? null,
    listPrice: Number(p.listPrice),
    b2cPrice: Number(p.b2cPrice),
    b2bPrice: p.b2bPrice != null ? Number(p.b2bPrice) : null,
    stock: p.stock,
    isFeatured: p.isFeatured,
    imageUrl: p.images[0]?.url ?? null,
  };
}

// ---------- Navigasyon ----------

export type NavCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  children: { id: string; name: string; slug: string }[];
};

export async function getNavCategories(): Promise<NavCategory[]> {
  const cats = await db.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      imageUrl: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });
  return cats;
}

// ---------- Ana sayfa ----------

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: productCardSelect,
  });
  return rows.map(toCard);
}

/** Liste fiyatı satış fiyatından yüksek olanlar (indirimli). */
export async function getDiscountedProducts(limit = 8): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: { isActive: true, listPrice: { gt: db.product.fields.b2cPrice } },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: productCardSelect,
  });
  return rows.map(toCard);
}

export async function getBrands(): Promise<{ id: string; name: string; slug: string }[]> {
  return db.brand.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

// ---------- Kategori ----------

export type SortKey = "new" | "price-asc" | "price-desc" | "popular";

/** Bir kategorinin TÜM alt-soy id'leri (recursive) — ürün listelemede kullanılır. */
export async function getDescendantIds(categoryId: string): Promise<string[]> {
  const all = await db.category.findMany({ select: { id: true, parentId: true } });
  const childrenMap = new Map<string, string[]>();
  for (const c of all) {
    if (c.parentId) {
      if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
      childrenMap.get(c.parentId)!.push(c.id);
    }
  }
  const out: string[] = [];
  const stack = [categoryId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const child of childrenMap.get(id) ?? []) {
      out.push(child);
      stack.push(child);
    }
  }
  return out;
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true, slug: true } },
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });
}

export async function getCategoryProducts(opts: {
  categoryId: string;
  childIds?: string[];
  brandSlugs?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: SortKey;
}): Promise<ProductCardData[]> {
  const categoryIds = [opts.categoryId, ...(opts.childIds ?? [])];
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    categoryId: { in: categoryIds },
  };
  if (opts.brandSlugs?.length) where.brand = { slug: { in: opts.brandSlugs } };
  if (opts.inStock) where.stock = { gt: 0 };
  if (opts.minPrice != null || opts.maxPrice != null) {
    where.b2cPrice = {};
    if (opts.minPrice != null) (where.b2cPrice as Prisma.DecimalFilter).gte = opts.minPrice;
    if (opts.maxPrice != null) (where.b2cPrice as Prisma.DecimalFilter).lte = opts.maxPrice;
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    opts.sort === "price-asc"
      ? { b2cPrice: "asc" }
      : opts.sort === "price-desc"
        ? { b2cPrice: "desc" }
        : opts.sort === "popular"
          ? { viewCount: "desc" }
          : { createdAt: "desc" };

  const rows = await db.product.findMany({ where, orderBy, select: productCardSelect });
  return rows.map(toCard);
}

/** Bir kategorideki (alt kategoriler dahil) markalar — filtre için. */
export async function getCategoryBrands(categoryIds: string[]) {
  const rows = await db.product.findMany({
    where: { isActive: true, categoryId: { in: categoryIds }, brandId: { not: null } },
    distinct: ["brandId"],
    select: { brand: { select: { name: true, slug: true } } },
  });
  return rows
    .map((r) => r.brand)
    .filter((b): b is { name: string; slug: string } => b != null)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

// ---------- Ürün detay ----------

export async function getProductBySlug(slug: string) {
  const p = await db.product.findUnique({
    where: { slug },
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
      images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      reviews: { where: { isApproved: true }, select: { rating: true } },
      promoCampaigns: {
        where: {
          isPublished: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
          ],
        },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { slug: true, badge: true, endsAt: true },
      },
    },
  });
  if (!p) return null;
  const ratings = p.reviews.map((r) => r.rating);
  return {
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    barcode: p.barcode,
    unit: p.unit,
    shortDescription: p.shortDescription,
    description: p.description,
    technicalSpecs: p.technicalSpecs,
    videoUrl: p.videoUrl,
    warranty: p.warranty,
    listPrice: Number(p.listPrice),
    b2cPrice: Number(p.b2cPrice),
    b2bPrice: p.b2bPrice != null ? Number(p.b2bPrice) : null,
    vatRate: p.vatRate,
    stock: p.stock,
    minOrder: p.minOrder,
    isFeatured: p.isFeatured,
    brand: p.brand,
    category: p.category,
    images: p.images,
    ratingAvg: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    ratingCount: ratings.length,
    activeCampaign: p.promoCampaigns[0]
      ? {
          slug: p.promoCampaigns[0].slug,
          badge: p.promoCampaigns[0].badge,
          endsAt: p.promoCampaigns[0].endsAt,
        }
      : null,
  };
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4,
): Promise<ProductCardData[]> {
  if (!categoryId) return [];
  const rows = await db.product.findMany({
    where: { isActive: true, categoryId, id: { not: excludeId } },
    take: limit,
    orderBy: { isFeatured: "desc" },
    select: productCardSelect,
  });
  return rows.map(toCard);
}

// ---------- Arama ----------

export async function searchProducts(q: string, limit = 20): Promise<ProductCardData[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const rows = await db.product.findMany({
    where: {
      isActive: true,
      searchText: { contains: normalizeSearch(term) },
    },
    take: limit,
    orderBy: { isFeatured: "desc" },
    select: productCardSelect,
  });
  return rows.map(toCard);
}
