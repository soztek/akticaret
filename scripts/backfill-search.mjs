// Ürün searchText alanını normalize edilmiş (ASCII, küçük harf) haliyle doldurur.
// Kullanım: node --env-file=.env scripts/backfill-search.mjs [--only-empty]
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const onlyEmpty = process.argv.includes("--only-empty");
const sql = `UPDATE "Product" SET "searchText" = lower(translate(coalesce(name,'') || ' ' || coalesce(sku,''), 'ÇĞİIÖŞÜçğıöşü', 'cgiiosucgiosu'))${onlyEmpty ? ` WHERE "searchText" = ''` : ''}`;
const n = await db.$executeRawUnsafe(sql);
console.log("searchText güncellenen satır:", n);
await db.$disconnect();
