import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { DealerActions } from "./dealer-actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Bekliyor", cls: "bg-warning/10 text-warning" },
  APPROVED: { label: "Onaylı", cls: "bg-success/10 text-success" },
  REJECTED: { label: "Reddedildi", cls: "bg-danger/10 text-danger" },
  SUSPENDED: { label: "Askıda", cls: "bg-ink/10 text-ink" },
};

export default async function AdminDealers() {
  const [dealers, groups, pendingCount] = await Promise.all([
    db.b2BCustomer.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { user: { select: { email: true } }, customerGroup: { select: { name: true } } },
    }),
    db.customerGroup.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.b2BCustomer.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Bayiler</h1>
        <p className="text-sm text-muted">
          {dealers.length} başvuru · {pendingCount} bekliyor
        </p>
      </div>

      {dealers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper p-12 text-center text-muted">
          Henüz bayi başvurusu yok.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full text-sm">
            <thead className="bg-mist text-left text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Firma</th>
                <th className="px-4 py-2.5 font-semibold">Yetkili</th>
                <th className="px-4 py-2.5 font-semibold">İletişim</th>
                <th className="px-4 py-2.5 font-semibold">Grup</th>
                <th className="px-4 py-2.5 font-semibold">Durum</th>
                <th className="px-4 py-2.5 font-semibold">Tarih</th>
                <th className="px-4 py-2.5 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {dealers.map((d) => (
                <tr key={d.id} className="align-top hover:bg-mist/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{d.companyName}</p>
                    {d.taxNumber && <p className="text-xs text-muted">VKN: {d.taxNumber}</p>}
                    {(d.city || d.district) && (
                      <p className="text-xs text-muted">{[d.district, d.city].filter(Boolean).join(" / ")}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">{d.contactName}</td>
                  <td className="px-4 py-3 text-muted">
                    <p>{d.phone}</p>
                    <p className="text-xs">{d.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{d.customerGroup?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[d.status]?.cls}`}>
                      {STATUS[d.status]?.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDate(d.createdAt)}</td>
                  <td className="px-4 py-3">
                    <DealerActions
                      b2bId={d.id}
                      status={d.status}
                      groups={groups}
                      currentGroupId={d.customerGroupId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
