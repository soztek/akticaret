import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const revalidate = 3600; // 1 saat

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/kategoriler`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/kampanyalar`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/bayi/basvuru`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const [cats, prods, camps] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.promoCampaign.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const catEntries: MetadataRoute.Sitemap = cats.map((c) => ({
    url: `${BASE}/kategori/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = prods.map((p) => ({
    url: `${BASE}/urun/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const campEntries: MetadataRoute.Sitemap = camps.map((c) => ({
    url: `${BASE}/kampanyalar/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...catEntries, ...productEntries, ...campEntries];
}
