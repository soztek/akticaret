import { MessageCircle } from "lucide-react";
import { getSettings, waNumber } from "@/lib/settings";

export async function WhatsAppFloat() {
  const s = await getSettings();
  const phone = waNumber(s.whatsapp) || "905385832704";
  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişime geç"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-success text-white shadow-lg transition hover:scale-105 lg:bottom-6"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
