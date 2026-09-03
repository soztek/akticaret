import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const cats = await db.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      parentId: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });

  const nameById = new Map(cats.map((c) => [c.id, c.name]));
  const roots = cats.filter((c) => !c.parentId);
  const childrenOf = (id: string) => cats.filter((c) => c.parentId === id);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Kategoriler</h1>
        <p className="text-sm text-muted">{cats.length} kategori</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-mist text-left text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Kategori</th>
              <th className="px-4 py-2.5 font-semibold">Üst Kategori</th>
              <th className="px-4 py-2.5 font-semibold">Ürün</th>
              <th className="px-4 py-2.5 font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {roots.map((root) => (
              <CategoryRows
                key={root.id}
                cat={root}
                depth={0}
                childrenOf={childrenOf}
                nameById={nameById}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Cat = {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  _count: { products: number };
};

function CategoryRows({
  cat,
  depth,
  childrenOf,
  nameById,
}: {
  cat: Cat;
  depth: number;
  childrenOf: (id: string) => Cat[];
  nameById: Map<string, string>;
}) {
  const kids = childrenOf(cat.id);
  return (
    <>
      <tr className="hover:bg-mist/50">
        <td className="px-4 py-2.5">
          <span style={{ paddingLeft: depth * 20 }} className="font-medium text-ink">
            {depth > 0 && <span className="text-faint">↳ </span>}
            {cat.name}
          </span>
        </td>
        <td className="px-4 py-2.5 text-muted">
          {cat.parentId ? nameById.get(cat.parentId) : "—"}
        </td>
        <td className="px-4 py-2.5 text-muted">{cat._count.products}</td>
        <td className="px-4 py-2.5">
          <span
            className={
              "rounded-full px-2 py-0.5 text-xs font-medium " +
              (cat.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger")
            }
          >
            {cat.isActive ? "Aktif" : "Pasif"}
          </span>
        </td>
      </tr>
      {kids.map((k) => (
        <CategoryRows key={k.id} cat={k} depth={depth + 1} childrenOf={childrenOf} nameById={nameById} />
      ))}
    </>
  );
}
