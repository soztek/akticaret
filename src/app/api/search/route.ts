import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ results: [] });
  const results = await searchProducts(q, 12);
  return NextResponse.json({ results });
}
