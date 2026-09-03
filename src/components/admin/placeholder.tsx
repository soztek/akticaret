import { Construction } from "lucide-react";

export function AdminPlaceholder({ title, note }: { title: string; note?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-paper p-12 text-center">
        <Construction className="h-10 w-10 text-orange" />
        <p className="font-semibold text-ink">Bu modül yakında</p>
        <p className="max-w-md text-sm text-muted">
          {note ?? "Bu bölüm bir sonraki geliştirme fazında devreye alınacak."}
        </p>
      </div>
    </div>
  );
}
