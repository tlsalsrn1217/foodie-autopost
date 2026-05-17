import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { placeSchema } from "@/lib/schemas/draftFormSchema";

export const runtime = "nodejs";

// 새 흐름: 클라이언트가 JSON 으로 메타데이터만 보냄.
// 사진은 별도로 signed URL 받아 Supabase 에 직접 업로드.
const createSchema = z.object({
  mood: z.string().max(500).optional().or(z.literal("")),
  keywords: z.array(z.string().min(1).max(20)).max(10).default([]),
  place: placeSchema.optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON parse 실패" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "유효하지 않은 입력", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { mood, keywords, place } = parsed.data;

  const draft = await prisma.draft.create({
    data: {
      mood: mood || null,
      keywords,
      placeName: place?.name,
      placeAddr: place?.roadAddress ?? place?.address,
      placeUrl: place?.url,
      placeLat: place?.lat,
      placeLng: place?.lng,
    },
  });

  return NextResponse.json({ draftId: draft.id });
}
