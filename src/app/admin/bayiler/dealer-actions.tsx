"use client";

import { useState, useTransition } from "react";
import { approveDealer, rejectDealer, suspendDealer } from "@/lib/actions/admin-dealers";

export function DealerActions({
  b2bId,
  status,
  groups,
  currentGroupId,
}: {
  b2bId: string;
  status: string;
  groups: { id: string; name: string }[];
  currentGroupId: string | null;
}) {
  const [pending, start] = useTransition();
  const [groupId, setGroupId] = useState(currentGroupId ?? groups[0]?.id ?? "");

  if (status === "PENDING") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="rounded-md border border-line bg-paper px-2 py-1.5 text-xs outline-none focus:border-orange"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button
          disabled={pending}
          onClick={() => start(() => approveDealer(b2bId, groupId))}
          className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Onayla
        </button>
        <button
          disabled={pending}
          onClick={() => start(() => rejectDealer(b2bId))}
          className="rounded-md border border-danger px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5 disabled:opacity-50"
        >
          Reddet
        </button>
      </div>
    );
  }

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

  return (
    <button
      disabled={pending}
      onClick={() => start(() => approveDealer(b2bId, currentGroupId))}
      className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
    >
      Onayla
    </button>
  );
}
