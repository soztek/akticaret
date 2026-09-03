import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Süper Admin",
  ADMIN: "Admin",
  STAFF: "Personel",
  B2B_CUSTOMER: "Bayi",
  B2C_CUSTOMER: "Müşteri",
};

export default async function AdminCustomers() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Müşteriler</h1>
        <p className="text-sm text-muted">{users.length} kullanıcı</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-mist text-left text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Ad Soyad</th>
              <th className="px-4 py-2.5 font-semibold">E-posta</th>
              <th className="px-4 py-2.5 font-semibold">Telefon</th>
              <th className="px-4 py-2.5 font-semibold">Rol</th>
              <th className="px-4 py-2.5 font-semibold">Sipariş</th>
              <th className="px-4 py-2.5 font-semibold">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-mist/50">
                <td className="px-4 py-2.5 font-medium text-ink">{u.name}</td>
                <td className="px-4 py-2.5 text-muted">{u.email}</td>
                <td className="px-4 py-2.5 text-muted">{u.phone ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted">{u._count.orders}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
