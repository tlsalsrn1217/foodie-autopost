import { NextResponse } from "next/server";
import { searchPlaces } from "@/lib/naver";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ places: [] });
  }

  try {
    const places = await searchPlaces(q);
    return NextResponse.json({ places });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "검색 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
