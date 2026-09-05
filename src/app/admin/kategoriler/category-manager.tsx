"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  Pencil,
  Search,
  X,
  Check,
  FolderTree,
} from "lucide-react";
import { CategoryIcon, ICON_NAMES } from "@/components/shop/category-icon";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  duplicateCategory,
} from "@/lib/actions/admin-categories";
import { normalizeSearch } from "@/lib/search-normalize";

export type AdminCat = {
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  isActive: boolean;
  productCount: number;
};

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-paper px-2 py-2 text-sm outline-none focus:border-orange"
    >
      <option value="">İkon (yok)</option>
      {ICON_NAMES.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function ParentSelect({
  cats,
  value,
  exclude,
  onChange,
}: {
  cats: AdminCat[];
  value: string;
  exclude?: Set<string>;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-paper px-2 py-2 text-sm outline-none focus:border-orange"
    >
      <option value="">— Üst kategori (kök) —</option>
      {cats
        .filter((c) => !exclude?.has(c.id))
        .map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
    </select>
  );
}

export function CategoryManager({ categories }: { categories: AdminCat[] }) {
  const [pending, start] = useTransition();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const childrenOf = useMemo(() => {
    const m = new Map<string, AdminCat[]>();
    for (const c of categories) {
      const k = c.parentId ?? "__root__";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    }
    return m;
  }, [categories]);

  const nameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const run = (fn: () => Promise<{ ok?: boolean; error?: string }>) => {
    setErr(null);
    start(async () => {
      const r = await fn();
      if (r?.error) setErr(r.error);
      else {
        setEditingId(null);
        setAdding(false);
      }
    });
  };

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const allParentIds = useMemo(
    () => new Set(categories.map((c) => c.parentId).filter(Boolean) as string[]),
    [categories],
  );
  const collapseAll = () => setCollapsed(new Set(allParentIds));
  const expandAll = () => setCollapsed(new Set());

  // Arama: eşleşen düz liste
  const q = normalizeSearch(search);
  const searching = q.length > 0;
  const matches = searching
    ? categories.filter((c) => normalizeSearch(c.name).includes(q))
    : [];

  return (
    <div>
      {err && (
        <div className="mb-3 rounded-lg bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">{err}</div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kategori ara…"
            className="w-full rounded-full border border-line bg-paper py-2.5 pl-9 pr-9 text-sm outline-none focus:border-orange"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {!searching && (
          <div className="flex gap-2 text-sm">
            <button onClick={collapseAll} className="rounded-lg border border-line px-3 py-2 hover:border-navy">
              Tümünü daralt
            </button>
            <button onClick={expandAll} className="rounded-lg border border-line px-3 py-2 hover:border-navy">
              Tümünü genişlet
            </button>
          </div>
        )}
        <button
          onClick={() => { setAdding((v) => !v); setErr(null); }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" /> Yeni Kategori
        </button>
      </div>

      {adding && (
        <AddForm
          cats={categories}
          pending={pending}
          onCancel={() => setAdding(false)}
          onSave={(name, parentId, icon) => run(() => createCategory({ name, parentId, icon }))}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        {categories.length === 0 ? (
          <p className="p-10 text-center text-muted">Henüz kategori yok.</p>
        ) : searching ? (
          matches.length === 0 ? (
            <p className="p-8 text-center text-muted">&quot;{search}&quot; için kategori bulunamadı.</p>
          ) : (
            <ul className="divide-y divide-line">
              {matches.map((c) => (
                <Row
                  key={c.id}
                  cat={c}
                  depth={0}
                  hasChildren={false}
                  isCollapsed={false}
                  parentLabel={c.parentId ? nameById.get(c.parentId) ?? null : null}
                  cats={categories}
                  editing={editingId === c.id}
                  pending={pending}
                  onToggle={() => {}}
                  onEdit={() => { setEditingId(c.id); setErr(null); }}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={(name, parentId, icon, isActive) =>
                    run(() => updateCategory({ id: c.id, name, parentId, icon, isActive }))
                  }
                  onCopy={() => run(() => duplicateCategory(c.id))}
                  onDelete={() => {
                    if (confirm(`"${c.name}" kategorisi silinsin mi? (Ürünleri kategorisiz kalır)`))
                      run(() => deleteCategory(c.id));
                  }}
                />
              ))}
            </ul>
          )
        ) : (
          <ul className="divide-y divide-line">
            {(childrenOf.get("__root__") ?? []).map((root) => (
              <Tree
                key={root.id}
                cat={root}
                depth={0}
                childrenOf={childrenOf}
                collapsed={collapsed}
                cats={categories}
                editingId={editingId}
                pending={pending}
                onToggle={toggle}
                setEditingId={(id) => { setEditingId(id); setErr(null); }}
                run={run}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Tree({
  cat,
  depth,
  childrenOf,
  collapsed,
  cats,
  editingId,
  pending,
  onToggle,
  setEditingId,
  run,
}: {
  cat: AdminCat;
  depth: number;
  childrenOf: Map<string, AdminCat[]>;
  collapsed: Set<string>;
  cats: AdminCat[];
  editingId: string | null;
  pending: boolean;
  onToggle: (id: string) => void;
  setEditingId: (id: string | null) => void;
  run: (fn: () => Promise<{ ok?: boolean; error?: string }>) => void;
}) {
  const kids = childrenOf.get(cat.id) ?? [];
  const isCollapsed = collapsed.has(cat.id);
  return (
    <>
      <Row
        cat={cat}
        depth={depth}
        hasChildren={kids.length > 0}
        isCollapsed={isCollapsed}
        parentLabel={null}
        cats={cats}
        editing={editingId === cat.id}
        pending={pending}
        onToggle={() => onToggle(cat.id)}
        onEdit={() => setEditingId(cat.id)}
        onCancelEdit={() => setEditingId(null)}
        onSaveEdit={(name, parentId, icon, isActive) =>
          run(() => updateCategory({ id: cat.id, name, parentId, icon, isActive }))
        }
        onCopy={() => run(() => duplicateCategory(cat.id))}
        onDelete={() => {
          if (confirm(`"${cat.name}" kategorisi silinsin mi? (Ürünleri kategorisiz kalır)`))
            run(() => deleteCategory(cat.id));
        }}
      />
      {!isCollapsed &&
        kids.map((k) => (
          <Tree
            key={k.id}
            cat={k}
            depth={depth + 1}
            childrenOf={childrenOf}
            collapsed={collapsed}
            cats={cats}
            editingId={editingId}
            pending={pending}
            onToggle={onToggle}
            setEditingId={setEditingId}
            run={run}
          />
        ))}
    </>
  );
}

function Row({
  cat,
  depth,
  hasChildren,
  isCollapsed,
  parentLabel,
  cats,
  editing,
  pending,
  onToggle,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onCopy,
  onDelete,
}: {
  cat: AdminCat;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  parentLabel: string | null;
  cats: AdminCat[];
  editing: boolean;
  pending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (name: string, parentId: string | null, icon: string | null, isActive: boolean) => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(cat.name);
  const [parentId, setParentId] = useState(cat.parentId ?? "");
  const [icon, setIcon] = useState(cat.icon ?? "");
  const [isActive, setIsActive] = useState(cat.isActive);

  if (editing) {
    return (
      <li className="bg-mist/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-40 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-orange"
            placeholder="Kategori adı"
          />
          <ParentSelect cats={cats} value={parentId} exclude={new Set([cat.id])} onChange={setParentId} />
          <IconSelect value={icon} onChange={setIcon} />
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-orange" />
            Aktif
          </label>
          <button
            disabled={pending}
            onClick={() => onSaveEdit(name, parentId || null, icon || null, isActive)}
            className="inline-flex items-center gap-1 rounded-lg bg-orange px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Kaydet
          </button>
          <button onClick={onCancelEdit} className="rounded-lg border border-line px-3 py-2 text-sm">
            İptal
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 py-2.5 pr-3 hover:bg-mist/40">
      <div className="flex min-w-0 flex-1 items-center gap-2" style={{ paddingLeft: 12 + depth * 22 }}>
        {hasChildren ? (
          <button onClick={onToggle} className="text-muted hover:text-ink" aria-label="Aç/Kapat">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <CategoryIcon name={cat.icon} className="h-4 w-4 shrink-0 text-navy" />
        <span className="truncate font-medium text-ink">{cat.name}</span>
        {parentLabel && <span className="shrink-0 text-xs text-faint">← {parentLabel}</span>}
        <span className="shrink-0 rounded-full bg-navy/5 px-2 py-0.5 text-xs text-muted">
          {cat.productCount} ürün
        </span>
        {!cat.isActive && (
          <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">Pasif</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={onEdit} title="Düzenle" className="rounded-md p-1.5 text-muted hover:bg-navy/5 hover:text-navy">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={onCopy} disabled={pending} title="Kopyala" className="rounded-md p-1.5 text-muted hover:bg-navy/5 hover:text-navy disabled:opacity-50">
          <Copy className="h-4 w-4" />
        </button>
        <button onClick={onDelete} disabled={pending} title="Sil" className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function AddForm({
  cats,
  pending,
  onCancel,
  onSave,
}: {
  cats: AdminCat[];
  pending: boolean;
  onCancel: () => void;
  onSave: (name: string, parentId: string | null, icon: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [icon, setIcon] = useState("");
  return (
    <div className="mb-4 rounded-xl border border-orange/40 bg-orange/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <FolderTree className="h-4 w-4 text-orange" /> Yeni Kategori
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kategori adı"
          className="min-w-48 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-orange"
        />
        <ParentSelect cats={cats} value={parentId} onChange={setParentId} />
        <IconSelect value={icon} onChange={setIcon} />
        <button
          disabled={pending || !name.trim()}
          onClick={() => onSave(name, parentId || null, icon || null)}
          className="inline-flex items-center gap-1 rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Ekle
        </button>
        <button onClick={onCancel} className="rounded-lg border border-line px-3 py-2 text-sm">
          İptal
        </button>
      </div>
    </div>
  );
}
