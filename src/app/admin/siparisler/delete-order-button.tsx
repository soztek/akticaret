"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteOrder } from "@/lib/actions/admin-orders";

export function DeleteOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onDelete() {
    if (!confirm(`${orderNumber} numaralı sipariş kalıcı olarak silinecek. Devam edilsin mi?`)) return;
    start(async () => {
      const res = await deleteOrder(orderId);
      if (res.error) alert(res.error);
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      title="Siparişi sil"
      className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:border-danger hover:bg-danger/10 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Sil
    </button>
  );
}
