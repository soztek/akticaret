"use client";

import { useState, useTransition } from "react";
import { approveDealer, rejectDealer, suspendDealer } from "@/lib/actions/admin-dealers";

type Term = "PESIN" | "VADELI";

export function DealerActions({
  b2bId,
  status,
  groups,
  currentGroupId,
  currentDiscount,
  currentTerm,
}: {
  b2bId: string;
  status: string;
  groups: { id: string; name: string }[];
  currentGroupId: string | null;
  currentDiscount: number;
  currentTerm: Term;
}) {
  const [pending, start] = useTransition();
  const [groupId, setGroupId] = useState(currentGroupId ?? groups[0]?.id ?? "");
  const [discount, setDiscount] = useState(String(currentDiscount ?? 0));
  const [term, setTerm] = useState<Term>(currentTerm ?? "PESIN");
  const [err, setErr] = useState<string | null>(null);

  function doApprove() {
    const pct = Number(String(discount).replace(",", "."));
    if (!Number.isFinite(pct) || pct < 0 || pct > 90) {
      setErr("İskonto %0–90 arası olmalı.");
      return;
    }
    setErr(null);
    start(async () => {
      const res = await approveDealer(b2bId, { customerGroupId: groupId || null, discountPercent: pct, paymentTerm: term });
      if (res?.error) setErr(res.error);
    });
  }

  // Onaylı bayi → sadece askıya alma
  if (status === "APPROVED") {
    return (
      <button
        disabled={pending}
        onClick={() => start(() => suspendDealer(b2bId))}
        className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-danger hover:text-danger disabled:opacity-50"
      >
        Askıya Al
      </button>
    );
  }

  // PENDING / REJECTED / SUSPENDED → onay formu (grup + iskonto + ödeme)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-muted">
          Grup
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="rounded-md border border-line bg-paper px-2 py-1.5 text-xs text-ink outline-none focus:border-orange"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs text-muted">
          İskonto %
          <input
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            inputMode="decimal"
            className="w-16 rounded-md border border-line bg-paper px-2 py-1.5 text-right text-xs text-ink outline-none focus:border-orange"
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-muted">
          Ödeme
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value as Term)}
            className="rounded-md border border-line bg-paper px-2 py-1.5 text-xs text-ink outline-none focus:border-orange"
          >
            <option value="PESIN">Peşin</option>
            <option value="VADELI">Vadeli (Cari)</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={pending}
          onClick={doApprove}
          className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Onayla
        </button>
        {status === "PENDING" && (
          <button
            disabled={pending}
            onClick={() => start(() => rejectDealer(b2bId))}
            className="rounded-md border border-danger px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5 disabled:opacity-50"
          >
            Reddet
          </button>
        )}
        {err && <span className="text-xs font-medium text-danger">{err}</span>}
      </div>
    </div>
  );
}
