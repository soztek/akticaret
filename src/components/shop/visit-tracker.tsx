"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Her sayfa görüntülemede /api/track'e kayıt atar.
 * /admin yolları sayılmaz. Aynı yol için tekrar tetiklenmeyi engeller.
 */
export function VisitTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* yoksay */
    }
  }, [pathname]);

  return null;
}
