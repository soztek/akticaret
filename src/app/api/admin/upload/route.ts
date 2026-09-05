import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { saveUpload } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_WRITE).catch(() => null);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }
  try {
    const url = await saveUpload(file);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Yükleme başarısız" },
      { status: 400 },
    );
  }
}
