"use client";

import { useTransition } from "react";
import { togglePublish, deleteCampaign } from "@/lib/actions/admin-campaigns";
import { Trash2 } from "lucide-react";

export function CampaignRowActions({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        disabled={pending}
        onClick={() => start(() => togglePublish(id, !isPublished))}
        className={
          "rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-50 " +
          (isPublished ? "bg-success/10 text-success" : "bg-ink/10 text-muted")
        }
      >
        {isPublished ? "Yayında" : "Taslak"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Bu kampanya silinsin mi?")) start(() => void deleteCampaign(id));
        }}
        title="Sil"
        className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
