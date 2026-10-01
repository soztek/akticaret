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

  // 2) Bayi grupları (kategori/etiket). İskonto artık bayiye özel, onayda belirlenir.
  const groups = [
    { name: "Standart", slug: "standart", sortOrder: 0 },
    { name: "Toptan Bayi", slug: "toptan-bayi", sortOrder: 1 },
  ];
  for (const g of groups) {
    await db.customerGroup.upsert({
      where: { slug: g.slug },
      update: { name: g.name, sortOrder: g.sortOrder, isActive: true },
      create: { ...g, discountPercent: 0 },
    });
  }
  // Eski kademeler (Silver/Gold/Platinum) artık kullanılmıyor → pasifleştir.
  await db.customerGroup.updateMany({
    where: { slug: { in: ["silver", "gold", "platinum"] } },
    data: { isActive: false },
  });
  console.log(`✔ ${groups.length} bayi grubu (Standart, Toptan Bayi).`);

  // 3) Süper admin
  // SUPER_ADMIN_EMAIL env'i varsa: o e-postadaki kullanıcı
  //   - varsa → SUPER_ADMIN'e YÜKSELT (şifreye dokunma),
  //   - yoksa → yeni süper admin oluştur (SUPER_ADMIN_PASSWORD ile).
  // Env yoksa ve hiç süper admin yoksa → varsayılanı oluştur. Varsa dokunma.
  const envEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  if (envEmail) {
    const user = await db.user.findUnique({ where: { email: envEmail } });
    if (user) {
      if (user.role !== "SUPER_ADMIN" || !user.isActive) {
        await db.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN", isActive: true } });
        console.log(`✔ Süper admine yükseltildi: ${envEmail} (şifre değişmedi).`);
      } else {
        console.log(`✔ Süper admin zaten: ${envEmail} — dokunulmadı.`);
      }
    } else {
      const password = process.env.SUPER_ADMIN_PASSWORD ?? "akticaret2026";
      await db.user.create({
        data: { email: envEmail, name: "Süper Admin", passwordHash: await bcrypt.hash(password, 12), role: "SUPER_ADMIN" },
      });
      console.log(`✔ Süper admin oluşturuldu: ${envEmail} / ${password}`);
    }
  } else {
    const existingAdmin = await db.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (!existingAdmin) {
      await db.user.create({
        data: { email: "admin@akticaret.com", name: "Süper Admin", passwordHash: await bcrypt.hash("akticaret2026", 12), role: "SUPER_ADMIN" },
      });
      console.log(`✔ Süper admin oluşturuldu: admin@akticaret.com / akticaret2026`);
    } else {
      console.log(`✔ Süper admin zaten var (${existingAdmin.email}) — dokunulmadı.`);
    }
  }

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
