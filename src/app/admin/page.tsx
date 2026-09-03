import Link from "next/link";
import { db } from "@/lib/db";
import { formatTL } from "@/lib/format";
import {
  Package,
  FolderTree,
  Store,
  ShoppingBag,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const [products, categories, activeProducts, outOfStock, pendingDealers, dealers, orders, pendingOrders] =
    await Promise.all([
      db.product.count(),
      db.category.count(),
      db.product.count({ where: { isActive: true } }),
      db.product.count({ where: { stock: { lte: 0 } } }),
      db.b2BCustomer.count({ where: { status: "PENDING" } }),
      db.b2BCustomer.count({ where: { status: "APPROVED" } }),
      db.order.count(),
      db.order.count({ where: { status: { in: ["NEW", "AWAITING_PAYMENT", "PAID"] } } }),
    ]);
  return { products, categories, activeProducts, outOfStock, pendingDealers, dealers, orders, pendingOrders };
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  href?: string;
  accent?: "orange" | "navy" | "danger" | "warning";
}) {
  const ring =
    accent === "danger"
      ? "text-danger bg-danger/10"
      : accent === "warning"
        ? "text-warning bg-warning/10"
        : accent === "navy"
          ? "text-navy bg-navy/10"
          : "text-orange bg-orange/10";
  const inner = (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-paper p-5 transition hover:shadow-sm">
      <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${ring}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboard() {
  const s = await getStats();
  const recentOrders = await db.order.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    select: { id: true, orderNumber: true, grandTotal: true, status: true, createdAt: true, billingName: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">AK TİCARET yönetim paneline hoş geldiniz.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam Ürün" value={s.products} icon={Package} href="/admin/urunler" accent="orange" />
        <StatCard label="Kategori" value={s.categories} icon={FolderTree} href="/admin/kategoriler" accent="navy" />
        <StatCard label="Bekleyen Bayi" value={s.pendingDealers} icon={Store} href="/admin/bayiler" accent="warning" />
        <StatCard label="Sipariş" value={s.orders} icon={ShoppingBag} href="/admin/siparisler" accent="navy" />
        <StatCard label="Aktif Ürün" value={s.activeProducts} icon={Package} accent="orange" />
        <StatCard label="Stokta Yok" value={s.outOfStock} icon={AlertTriangle} href="/admin/urunler?stok=yok" accent="danger" />
        <StatCard label="Onaylı Bayi" value={s.dealers} icon={Store} href="/admin/bayiler" accent="navy" />
        <StatCard label="Bekleyen Sipariş" value={s.pendingOrders} icon={Clock} href="/admin/siparisler" accent="warning" />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Son Siparişler</h2>
          <Link href="/admin/siparisler" className="flex items-center gap-1 text-sm font-semibold text-orange hover:underline">
            Tümü <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          {recentOrders.length === 0 ? (
            <p className="p-8 text-center text-muted">Henüz sipariş yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-mist text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-semibold">Sipariş No</th>
                  <th className="px-4 py-2 font-semibold">Müşteri</th>
                  <th className="px-4 py-2 font-semibold">Tutar</th>
                  <th className="px-4 py-2 font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2 font-medium text-ink">{o.orderNumber}</td>
                    <td className="px-4 py-2 text-muted">{o.billingName ?? "—"}</td>
                    <td className="px-4 py-2 text-ink">{formatTL(Number(o.grandTotal))}</td>
                    <td className="px-4 py-2 text-muted">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
