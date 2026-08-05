import { NextRequest, NextResponse } from "next/server";

// Next.js 16: middleware.ts -> proxy.ts (fonksiyon adı da `proxy`), nodejs runtime.
// Burada sadece OTURUM ÇEREZİ VARLIĞI kontrol edilir (hızlı kapı).
// Tam doğrulama + rol/yetki kontrolü ilgili layout'ta (getCurrentUser) yapılır.

const COOKIE_NAME = "ak_session";
const PROTECTED = ["/admin", "/hesabim", "/bayi"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.has(COOKIE_NAME);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/giris", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/hesabim/:path*", "/bayi/:path*"],
};
