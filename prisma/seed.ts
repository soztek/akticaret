import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSION_CATALOG } from "../src/lib/rbac";

const db = new PrismaClient();

async function main() {
  console.log("🌱 AK TİCARET seed başlıyor...");

  // 1) Yetki kataloğu
  for (const p of PERMISSION_CATALOG) {
    await db.permission.upsert({
      where: { key: p.key },
      update: { group: p.group, description: p.description },
      create: { key: p.key, group: p.group, description: p.description },
    });
  }
  console.log(`✔ ${PERMISSION_CATALOG.length} yetki eklendi.`);

  // 2) Müşteri grupları (B2B fiyatlandırma)
  const groups = [
    { name: "Standart", slug: "standart", discountPercent: 0, sortOrder: 0 },
    { name: "Silver", slug: "silver", discountPercent: 5, sortOrder: 1 },
    { name: "Gold", slug: "gold", discountPercent: 10, sortOrder: 2 },
    { name: "Platinum", slug: "platinum", discountPercent: 15, sortOrder: 3 },
  ];
  for (const g of groups) {
    await db.customerGroup.upsert({
      where: { slug: g.slug },
      update: { name: g.name, discountPercent: g.discountPercent, sortOrder: g.sortOrder },
      create: g,
    });
  }
  console.log(`✔ ${groups.length} müşteri grubu eklendi.`);

  // 3) Süper admin
  const email = (process.env.SUPER_ADMIN_EMAIL ?? "admin@akticaret.com").toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "akticaret2026";
  await db.user.upsert({
    where: { email },
    update: { role: "SUPER_ADMIN", isActive: true },
    create: {
      email,
      name: "Süper Admin",
      passwordHash: await bcrypt.hash(password, 12),
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✔ Süper admin: ${email} / ${password}`);

  // 4) Site ayarları (tekil satır)
  await db.siteSetting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      companyName: "AK TİCARET YAPI MALZEMELERİ",
      phone: "0538 583 27 04",
      whatsapp: "905385832704",
    },
  });
  console.log("✔ Site ayarları oluşturuldu.");

  console.log("✅ Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
