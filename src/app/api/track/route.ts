import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Basit ziyaret kaydı: client her public sayfa görüntülemede POST eder.
// IP sunucu tarafında header'dan okunur (client gönderemez).
export async function POST(req: Request) {
  try {
    const { path } = (await req.json()) as { path?: string };
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    // Yönetim ve API yollarını sayma
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return new NextResponse(null, { status: 204 });
    }

    const xff = req.headers.get("x-forwarded-for");
    const ip =
      (xff ? xff.split(",")[0].trim() : "") ||
      req.headers.get("x-real-ip") ||
      "bilinmiyor";
    const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;

    await db.visit.create({ data: { ip, path: path.slice(0, 300), ua } });

    return new NextResponse(null, { status: 204 });
  } catch {
    // İstatistik kaydı asla siteyi bozmasın
    return new NextResponse(null, { status: 204 });
  }
}
